-- FIX: Update products_view and sale_items_view to include multi-currency columns

drop view if exists products_view;
create view products_view
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
  default_sell_currency,
  current_stock,
  notes,
  is_active,
  created_at
from products;

comment on view products_view is
  'Gunakan view ini (bukan tabel products langsung) untuk semua query dari frontend, agar default_buy_price otomatis ter-mask untuk role Partner/Staff.';

drop view if exists sale_items_view;
create view sale_items_view
with (security_invoker = true) as
select
  si.id,
  si.sale_id,
  si.product_id,
  si.quantity,
  si.currency,
  si.foreign_sell_price,
  si.khr_to_usd_rate_snapshot,
  si.usd_to_idr_rate_snapshot,
  si.sell_price,
  case when get_user_role(s.workspace_id) in ('owner', 'admin')
    then si.cost_price_snapshot else null end as cost_price_snapshot,
  si.subtotal,
  case when get_user_role(s.workspace_id) in ('owner', 'admin')
    then si.profit else null end as profit
from sale_items si
join sales s on s.id = si.sale_id;

comment on view sale_items_view is
  'Gunakan view ini (bukan tabel sale_items langsung) untuk semua query dari frontend, agar cost_price_snapshot & profit otomatis ter-mask untuk role Partner/Staff.';
