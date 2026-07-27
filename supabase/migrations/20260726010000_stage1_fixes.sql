-- =============================================================================
-- Stage 1 Fixes: onboarding trigger, users policy, column-level masking,
-- dan koreksi permission workspace_members.
-- Jalankan SETELAH 20260726000000_init_schema.sql
-- =============================================================================

-------------------------------------------------------------------------------
-- FIX #1 (BLOCKING): Auto-provision workspace saat user baru signup
-------------------------------------------------------------------------------
-- Mendukung dua skenario:
--  a) Signup pertama kali (tanpa invite)      -> user jadi Owner, workspace baru dibuat
--  b) Signup lewat link undangan Partner/Staff -> user join ke workspace yang sudah ada
--
-- Untuk skenario (b), saat frontend memanggil supabase.auth.signUp(),
-- sertakan options.data:
--   { invited_workspace_id: '<uuid workspace>', invited_role: 'partner' | 'staff' | 'admin', invited_by: '<uuid owner>' }
-- Data ini diambil dari token/link undangan yang dibuat Owner (Bagian 8.10 PRD).

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  invited_workspace_id uuid;
  invited_role user_role;
  invited_by_id uuid;
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  invited_workspace_id := nullif(new.raw_user_meta_data->>'invited_workspace_id', '')::uuid;
  invited_role := nullif(new.raw_user_meta_data->>'invited_role', '')::user_role;
  invited_by_id := nullif(new.raw_user_meta_data->>'invited_by', '')::uuid;

  if invited_workspace_id is not null then
    -- Skenario B: user bergabung ke workspace existing lewat undangan
    insert into public.users (id, full_name, email, workspace_id)
    values (new.id, display_name, new.email, invited_workspace_id);

    insert into workspace_members (workspace_id, user_id, role, invited_by)
    values (invited_workspace_id, new.id, coalesce(invited_role, 'staff'), invited_by_id);
  else
    -- Skenario A: signup pertama kali, user otomatis jadi Owner dari workspace baru
    insert into workspaces (name, owner_id)
    values (display_name || '''s Business', new.id)
    returning id into new_workspace_id;

    insert into public.users (id, full_name, email, workspace_id)
    values (new.id, display_name, new.email, new_workspace_id);

    insert into workspace_members (workspace_id, user_id, role)
    values (new_workspace_id, new.id, 'owner');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-------------------------------------------------------------------------------
-- FIX #2 (BLOCKING): Policy untuk tabel `users` (sebelumnya RLS on, 0 policy)
-------------------------------------------------------------------------------
create policy "Users can view own profile" on users
  for select using (id = auth.uid());

create policy "Users can view profiles in same workspace" on users
  for select using (workspace_id = get_user_workspace());

create policy "Users can update own profile" on users
  for update using (id = auth.uid());

-------------------------------------------------------------------------------
-- FIX #3 (CRITICAL): Koreksi permission workspace_members -> hanya Owner
-------------------------------------------------------------------------------
drop policy if exists "Owner and Admin can manage members" on workspace_members;

create policy "Only Owner can manage members" on workspace_members
  for all using (
    workspace_id = get_user_workspace() and
    get_user_role(workspace_id) = 'owner'
  );

-------------------------------------------------------------------------------
-- FIX #4 (CRITICAL): Masking kolom modal/margin untuk Partner & Staff
-------------------------------------------------------------------------------
-- Products: sembunyikan default_buy_price dari Partner/Staff.
-- View ini otomatis pakai identitas pemanggil (auth.uid()) karena RLS pada
-- tabel dasar tetap dievaluasi terhadap session user, bukan owner view.
create or replace view products_view
with (security_invoker = true) as
select
  id,
  workspace_id,
  name,
  brand,
  variant,
  unit,
  case when get_user_role(workspace_id) in ('owner', 'admin')
    then default_buy_price
    else null
  end as default_buy_price,
  default_sell_price,
  current_stock,
  notes,
  is_active,
  created_at
from products;

-- Sale items: sembunyikan cost_price_snapshot & profit dari Partner/Staff.
create or replace view sale_items_view
with (security_invoker = true) as
select
  si.id,
  si.sale_id,
  si.product_id,
  si.quantity,
  si.sell_price,
  case when get_user_role(s.workspace_id) in ('owner', 'admin')
    then si.cost_price_snapshot else null end as cost_price_snapshot,
  si.subtotal,
  case when get_user_role(s.workspace_id) in ('owner', 'admin')
    then si.profit else null end as profit
from sale_items si
join sales s on s.id = si.sale_id;

comment on view products_view is
  'Gunakan view ini (bukan tabel products langsung) untuk semua query dari frontend, agar default_buy_price otomatis ter-mask untuk role Partner/Staff sesuai Bagian 10 PRD.';
comment on view sale_items_view is
  'Gunakan view ini (bukan tabel sale_items langsung) untuk semua query dari frontend, agar cost_price_snapshot & profit otomatis ter-mask untuk role Partner/Staff sesuai Bagian 10 PRD.';

-------------------------------------------------------------------------------
-- FIX #5: CHECK constraint - reason wajib diisi untuk stock adjustment
-------------------------------------------------------------------------------
alter table stock_movements
  add constraint chk_adjustment_requires_reason
  check (type != 'adjustment' or reason is not null);

-------------------------------------------------------------------------------
-- FIX #6: Soft-delete columns untuk purchases, sales, expenses (Bagian 15 PRD)
-------------------------------------------------------------------------------
alter table purchases add column is_cancelled boolean not null default false;
alter table purchases add column cancel_reason text;
alter table purchases add column cancelled_at timestamptz;
alter table purchases add column cancelled_by uuid references auth.users(id);

alter table sales add column is_cancelled boolean not null default false;
alter table sales add column cancel_reason text;
alter table sales add column cancelled_at timestamptz;
alter table sales add column cancelled_by uuid references auth.users(id);

alter table expenses add column is_cancelled boolean not null default false;
alter table expenses add column cancel_reason text;
alter table expenses add column cancelled_at timestamptz;
alter table expenses add column cancelled_by uuid references auth.users(id);

-------------------------------------------------------------------------------
-- FIX #7: Perkuat trigger stok agar validasi tanda quantity vs type
-------------------------------------------------------------------------------
create or replace function update_product_stock()
returns trigger as $$
begin
  -- Validasi: type 'out' wajib quantity negatif, type 'in' wajib quantity positif.
  -- 'adjustment' boleh + atau - tergantung arah koreksi.
  if NEW.type = 'in' and NEW.quantity <= 0 then
    raise exception 'stock_movements: quantity harus positif untuk type=in';
  end if;
  if NEW.type = 'out' and NEW.quantity >= 0 then
    raise exception 'stock_movements: quantity harus negatif untuk type=out';
  end if;

  update products set current_stock = current_stock + NEW.quantity where id = NEW.product_id;
  return NEW;
end;
$$ language plpgsql;
