-- Trigger functions are invoked by PostgreSQL, never through the Data API.
revoke execute on function public.handle_cms_banner_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_customer_address_defaults() from public, anon, authenticated;
revoke execute on function public.handle_customer_address_delete() from public, anon, authenticated;

-- Cover foreign keys used by operational deletes, joins and recovery reporting.
create index if not exists abandoned_cart_notifications_recovered_order_id_idx
  on public.abandoned_cart_notifications (recovered_order_id)
  where recovered_order_id is not null;
create index if not exists analytics_events_user_id_idx
  on public.analytics_events (user_id)
  where user_id is not null;
create index if not exists size_chart_entries_product_id_idx
  on public.size_chart_entries (product_id)
  where product_id is not null;

-- Evaluate auth.uid() once per statement instead of once per candidate row.
drop policy if exists cart_items_owner_select on public.cart_items;
create policy cart_items_owner_select
on public.cart_items for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists cart_items_owner_insert on public.cart_items;
create policy cart_items_owner_insert
on public.cart_items for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists cart_items_owner_update on public.cart_items;
create policy cart_items_owner_update
on public.cart_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists cart_items_owner_delete on public.cart_items;
create policy cart_items_owner_delete
on public.cart_items for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists wishlist_items_owner_select on public.wishlist_items;
create policy wishlist_items_owner_select
on public.wishlist_items for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists wishlist_items_owner_insert on public.wishlist_items;
create policy wishlist_items_owner_insert
on public.wishlist_items for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists wishlist_items_owner_delete on public.wishlist_items;
create policy wishlist_items_owner_delete
on public.wishlist_items for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists customer_addresses_owner_select on public.customer_addresses;
create policy customer_addresses_owner_select
on public.customer_addresses for select to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.has_any_role(array['admin','super_admin']::public.app_role[]))
);

drop policy if exists customer_addresses_owner_insert on public.customer_addresses;
create policy customer_addresses_owner_insert
on public.customer_addresses for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists customer_addresses_owner_update on public.customer_addresses;
create policy customer_addresses_owner_update
on public.customer_addresses for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists customer_addresses_owner_delete on public.customer_addresses;
create policy customer_addresses_owner_delete
on public.customer_addresses for delete to authenticated
using ((select auth.uid()) = user_id);
