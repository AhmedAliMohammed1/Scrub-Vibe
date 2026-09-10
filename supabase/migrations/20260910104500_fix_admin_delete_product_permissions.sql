-- Migration: Fix permissions for admin_delete_product and cascading table cleanup
-- Ensures private schema is accessible, inventory_movements & inventory_alerts have delete privileges,
-- and admin_delete_product runs as security definer with authorization checks.

grant usage on schema private to postgres, service_role, authenticated;
grant execute on function private.has_any_role(public.app_role[]) to postgres, service_role, authenticated;

grant delete on public.inventory_movements to authenticated;
grant delete on public.inventory_alerts to authenticated;

drop policy if exists inventory_movements_staff_delete on public.inventory_movements;
create policy inventory_movements_staff_delete on public.inventory_movements
for delete to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

drop policy if exists inventory_alerts_staff_delete on public.inventory_alerts;
create policy inventory_alerts_staff_delete on public.inventory_alerts
for delete to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

create or replace function public.admin_delete_product(p_product_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_variant_ids bigint[];
begin
  if not (select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Product not found';
  end if;

  -- Collect all variant IDs for this product
  select coalesce(array_agg(id), array[]::bigint[]) into v_variant_ids
  from public.product_variants
  where product_id = p_product_id;

  -- Remove inventory movements for variants of this product to satisfy foreign key constraint on delete restrict
  if cardinality(v_variant_ids) > 0 then
    delete from public.inventory_movements
    where variant_id = any(v_variant_ids);
  end if;

  -- Delete the product itself.
  -- This cascades to:
  --   product_translations
  --   product_images
  --   product_options & product_option_values
  --   product_variants (and inventory, inventory_alerts, product_variant_values)
  --   size_chart_entries
  --   cart_items
  --   wishlist_items
  --   stock_subscriptions
  --   product_recommendations
  -- And sets null on:
  --   order_items.product_id and variant_id
  --   analytics_events.product_id
  delete from public.products
  where id = p_product_id;

  return true;
end;
$$;

revoke all on function public.admin_delete_product(bigint) from public, anon;
grant execute on function public.admin_delete_product(bigint) to authenticated;
