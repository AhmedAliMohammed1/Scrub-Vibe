drop policy inventory_public_read on public.inventory;
drop policy inventory_staff_select on public.inventory;

create policy inventory_public_read on public.inventory
for select
to anon
using (
  exists (
    select 1
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = variant_id
      and v.is_active
      and p.status = 'active'
      and p.published_at <= now()
  )
);

create policy inventory_authenticated_read on public.inventory
for select
to authenticated
using (
  exists (
    select 1
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = variant_id
      and v.is_active
      and p.status = 'active'
      and p.published_at <= now()
  )
  or (
    select private.has_any_role(
      array['warehouse', 'product_manager', 'admin', 'super_admin']::public.app_role[]
    )
  )
);
