-- Fix foreign keys to point to public.users instead of auth.users for PostgREST joins

-- Fix workspace_members
alter table public.workspace_members drop constraint workspace_members_user_id_fkey;
alter table public.workspace_members add constraint workspace_members_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

-- Fix activity_logs
alter table public.activity_logs drop constraint activity_logs_user_id_fkey;
alter table public.activity_logs add constraint activity_logs_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

-- Also fix trips created_by
alter table public.trips drop constraint trips_created_by_fkey;
alter table public.trips add constraint trips_created_by_fkey foreign key (created_by) references public.users(id) on delete cascade;

-- Also fix purchases created_by
alter table public.purchases drop constraint purchases_created_by_fkey;
alter table public.purchases add constraint purchases_created_by_fkey foreign key (created_by) references public.users(id) on delete cascade;

-- Also fix sales created_by
alter table public.sales drop constraint sales_created_by_fkey;
alter table public.sales add constraint sales_created_by_fkey foreign key (created_by) references public.users(id) on delete cascade;

-- Also fix payments created_by
alter table public.payments drop constraint payments_created_by_fkey;
alter table public.payments add constraint payments_created_by_fkey foreign key (created_by) references public.users(id) on delete cascade;

-- Also fix expenses created_by
alter table public.expenses drop constraint expenses_created_by_fkey;
alter table public.expenses add constraint expenses_created_by_fkey foreign key (created_by) references public.users(id) on delete cascade;

-- Also fix stock_movements created_by
alter table public.stock_movements drop constraint stock_movements_created_by_fkey;
alter table public.stock_movements add constraint stock_movements_created_by_fkey foreign key (created_by) references public.users(id) on delete cascade;
