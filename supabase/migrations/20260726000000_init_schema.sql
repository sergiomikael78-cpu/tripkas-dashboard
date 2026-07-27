-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enum Types
create type user_role as enum ('owner', 'admin', 'partner', 'staff');
create type trip_status as enum ('running', 'closed');
create type product_unit as enum ('pak', 'slop', 'karton');
create type customer_type as enum ('teman', 'warung');
create type payment_status as enum ('lunas', 'piutang');
create type expense_category as enum ('trip', 'operasional_harian', 'lainnya');
create type stock_movement_type as enum ('in', 'out', 'adjustment');
create type reference_type as enum ('purchase', 'sale', 'manual');

-- 9.2 workspaces
create table workspaces (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    owner_id uuid not null references auth.users(id),
    created_at timestamptz default now()
);

-- 9.1 users (Profile table linked to auth.users)
create table users (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null,
    avatar_url text,
    workspace_id uuid references workspaces(id),
    created_at timestamptz default now()
);

-- 9.4 workspace_members
create table workspace_members (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role user_role not null,
    invited_by uuid references auth.users(id),
    joined_at timestamptz default now(),
    unique(workspace_id, user_id)
);

-- 9.5 trips
create table trips (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    code text not null,
    start_date date not null,
    end_date date,
    status trip_status not null default 'running',
    notes text,
    created_by uuid not null references auth.users(id),
    created_at timestamptz default now()
);

-- 9.6 suppliers
create table suppliers (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    name text not null,
    contact text,
    notes text,
    created_at timestamptz default now()
);

-- 9.7 products
create table products (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    name text not null,
    brand text,
    variant text,
    unit product_unit not null,
    default_buy_price numeric not null default 0,
    default_sell_price numeric not null default 0,
    current_stock numeric not null default 0,
    notes text,
    is_active boolean not null default true,
    created_at timestamptz default now()
);

-- 9.8 customers
create table customers (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    name text not null,
    type customer_type not null,
    contact text,
    notes text,
    created_at timestamptz default now()
);

-- 9.9 purchases
create table purchases (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    trip_id uuid not null references trips(id),
    supplier_id uuid not null references suppliers(id),
    purchase_date date not null,
    notes text,
    created_by uuid not null references auth.users(id),
    created_at timestamptz default now()
);

-- 9.10 purchase_items
create table purchase_items (
    id uuid primary key default uuid_generate_v4(),
    purchase_id uuid not null references purchases(id) on delete cascade,
    product_id uuid not null references products(id),
    quantity numeric not null,
    buy_price numeric not null,
    subtotal numeric generated always as (quantity * buy_price) stored
);

-- 9.11 sales
create table sales (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    trip_id uuid references trips(id),
    customer_id uuid not null references customers(id),
    sale_date date not null,
    payment_status payment_status not null,
    due_date date,
    notes text,
    created_by uuid not null references auth.users(id),
    created_at timestamptz default now()
);

-- 9.12 sale_items
create table sale_items (
    id uuid primary key default uuid_generate_v4(),
    sale_id uuid not null references sales(id) on delete cascade,
    product_id uuid not null references products(id),
    quantity numeric not null,
    sell_price numeric not null,
    cost_price_snapshot numeric not null,
    subtotal numeric generated always as (quantity * sell_price) stored,
    profit numeric generated always as ((sell_price - cost_price_snapshot) * quantity) stored
);

-- 9.13 payments
create table payments (
    id uuid primary key default uuid_generate_v4(),
    sale_id uuid not null references sales(id) on delete cascade,
    amount numeric not null,
    paid_at date not null,
    notes text,
    created_by uuid not null references auth.users(id),
    created_at timestamptz default now()
);

-- 9.14 expenses
create table expenses (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    trip_id uuid references trips(id),
    category expense_category not null,
    amount numeric not null,
    expense_date date not null,
    notes text,
    created_by uuid not null references auth.users(id),
    created_at timestamptz default now()
);

-- 9.15 stock_movements
create table stock_movements (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    product_id uuid not null references products(id),
    type stock_movement_type not null,
    quantity numeric not null,
    reference_type reference_type not null,
    reference_id uuid,
    reason text,
    created_by uuid not null references auth.users(id),
    created_at timestamptz default now()
);

-- 9.16 activity_logs
create table activity_logs (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    user_id uuid not null references auth.users(id),
    action text not null,
    entity_type text not null,
    entity_id uuid not null,
    metadata jsonb,
    created_at timestamptz default now()
);

-------------------------------------------------------------------------------
-- Row Level Security (RLS)
-------------------------------------------------------------------------------
-- Aktifkan RLS di semua tabel
alter table workspaces enable row level security;
alter table users enable row level security;
alter table workspace_members enable row level security;
alter table trips enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table stock_movements enable row level security;
alter table activity_logs enable row level security;

-- Helper Function untuk mendapatkan role user saat ini
create or replace function get_user_role(workspace_id uuid)
returns user_role
language sql
security definer
set search_path = public
as $$
  select role from workspace_members
  where workspace_id = $1 and user_id = auth.uid()
  limit 1;
$$;

-- Helper Function untuk mendapatkan workspace id user saat ini
create or replace function get_user_workspace()
returns uuid
language sql
security definer
set search_path = public
as $$
  select workspace_id from users
  where id = auth.uid()
  limit 1;
$$;

-- RLS Policies untuk workspaces
create policy "Users can view their own workspace" on workspaces
  for select using (id = get_user_workspace());

-- RLS Policies untuk workspace_members
create policy "Members can view other members in same workspace" on workspace_members
  for select using (workspace_id = get_user_workspace());

create policy "Owner and Admin can manage members" on workspace_members
  for all using (
    workspace_id = get_user_workspace() and 
    (get_user_role(workspace_id) = 'owner' or get_user_role(workspace_id) = 'admin')
  );

-- Trips
create policy "All members can view trips" on trips for select using (workspace_id = get_user_workspace());
create policy "Owner/Admin can manage trips" on trips for all using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));

-- Master Data (suppliers, products, customers)
create policy "All members can view suppliers" on suppliers for select using (workspace_id = get_user_workspace());
create policy "Owner/Admin can manage suppliers" on suppliers for all using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));

create policy "All members can view products" on products for select using (workspace_id = get_user_workspace());
create policy "Owner/Admin can manage products" on products for all using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));

create policy "All members can view customers" on customers for select using (workspace_id = get_user_workspace());
create policy "Owner/Admin can manage customers" on customers for all using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));
create policy "Partner can insert customers" on customers for insert with check (workspace_id = get_user_workspace() and get_user_role(workspace_id) = 'partner');

-- Purchases
create policy "Owner/Admin/Partner can view purchases" on purchases for select using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin', 'partner'));
create policy "Owner/Admin/Partner can insert purchases" on purchases for insert with check (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin', 'partner'));
create policy "Owner/Admin can update/delete purchases" on purchases for update using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));
create policy "Owner/Admin can delete purchases" on purchases for delete using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));

create policy "Owner/Admin/Partner can view purchase_items" on purchase_items for select using (
  purchase_id in (select id from purchases where workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin', 'partner'))
);
create policy "Owner/Admin/Partner can insert purchase_items" on purchase_items for insert with check (
  purchase_id in (select id from purchases where workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin', 'partner'))
);
create policy "Owner/Admin can manage purchase_items" on purchase_items for all using (
  purchase_id in (select id from purchases where workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'))
);

-- Sales
create policy "All members can view sales" on sales for select using (workspace_id = get_user_workspace());
create policy "All members can insert sales" on sales for insert with check (workspace_id = get_user_workspace());
create policy "Owner/Admin can manage sales" on sales for all using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));

create policy "All members can view sale_items" on sale_items for select using (
  sale_id in (select id from sales where workspace_id = get_user_workspace())
);
create policy "All members can insert sale_items" on sale_items for insert with check (
  sale_id in (select id from sales where workspace_id = get_user_workspace())
);
create policy "Owner/Admin can manage sale_items" on sale_items for all using (
  sale_id in (select id from sales where workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'))
);

-- Payments
create policy "All members can view payments" on payments for select using (
  sale_id in (select id from sales where workspace_id = get_user_workspace())
);
create policy "Owner/Admin/Partner can insert payments" on payments for insert with check (
  sale_id in (select id from sales where workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin', 'partner'))
);
create policy "Owner/Admin can manage payments" on payments for all using (
  sale_id in (select id from sales where workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'))
);

-- Expenses
create policy "All members can view expenses" on expenses for select using (workspace_id = get_user_workspace());
create policy "Owner/Admin/Partner can insert expenses" on expenses for insert with check (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin', 'partner'));
create policy "Owner/Admin can manage expenses" on expenses for all using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));

-- Stock Movements
create policy "All members can view stock_movements" on stock_movements for select using (workspace_id = get_user_workspace());
create policy "Owner/Admin/Partner can insert stock_movements" on stock_movements for insert with check (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin', 'partner'));
create policy "Owner/Admin can manage stock_movements" on stock_movements for all using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));

-- Activity Logs
create policy "Owner/Admin can view activity_logs" on activity_logs for select using (workspace_id = get_user_workspace() and get_user_role(workspace_id) in ('owner', 'admin'));
create policy "All members can insert activity_logs" on activity_logs for insert with check (workspace_id = get_user_workspace());

-------------------------------------------------------------------------------
-- Triggers untuk sinkronisasi stock (current_stock di products)
-------------------------------------------------------------------------------
create or replace function update_product_stock()
returns trigger as $$
begin
  -- quantity for out/adjustment is passed as negative or positive delta
  update products set current_stock = current_stock + NEW.quantity where id = NEW.product_id;
  return NEW;
end;
$$ language plpgsql;

create trigger trigger_update_product_stock
after insert on stock_movements
for each row execute function update_product_stock();
