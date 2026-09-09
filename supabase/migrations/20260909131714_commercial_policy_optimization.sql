create index product_bundles_created_by_idx on public.product_bundles(created_by) where created_by is not null;
create index product_bundles_updated_by_idx on public.product_bundles(updated_by) where updated_by is not null;
create index product_recommendations_created_by_idx on public.product_recommendations(created_by) where created_by is not null;

drop policy product_bundles_public_select on public.product_bundles;
drop policy product_bundles_staff_select on public.product_bundles;
create policy product_bundles_anon_select on public.product_bundles for select to anon
using (status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy product_bundles_authenticated_select on public.product_bundles for select to authenticated
using (
  (status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
  or (select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[]))
);

drop policy product_bundle_items_public_select on public.product_bundle_items;
drop policy product_bundle_items_staff_select on public.product_bundle_items;
create policy product_bundle_items_anon_select on public.product_bundle_items for select to anon
using (exists (
  select 1 from public.product_bundles b where b.id = bundle_id
    and b.status = 'active' and (b.starts_at is null or b.starts_at <= now()) and (b.ends_at is null or b.ends_at > now())
));
create policy product_bundle_items_authenticated_select on public.product_bundle_items for select to authenticated
using (
  exists (
    select 1 from public.product_bundles b where b.id = bundle_id
      and b.status = 'active' and (b.starts_at is null or b.starts_at <= now()) and (b.ends_at is null or b.ends_at > now())
  )
  or (select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[]))
);

drop policy product_recommendations_public_select on public.product_recommendations;
drop policy product_recommendations_staff_select on public.product_recommendations;
create policy product_recommendations_anon_select on public.product_recommendations for select to anon
using (is_active);
create policy product_recommendations_authenticated_select on public.product_recommendations for select to authenticated
using (is_active or (select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));

drop policy stock_subscriptions_customer_select on public.stock_subscriptions;
drop policy stock_subscriptions_staff_select on public.stock_subscriptions;
create policy stock_subscriptions_authenticated_select on public.stock_subscriptions for select to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.has_any_role(array['support','product_manager','analyst','admin','super_admin']::public.app_role[]))
);

drop policy return_requests_customer_select on public.return_requests;
drop policy return_requests_staff_select on public.return_requests;
create policy return_requests_authenticated_select on public.return_requests for select to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[]))
);

drop policy return_request_items_customer_select on public.return_request_items;
drop policy return_request_items_staff_select on public.return_request_items;
create policy return_request_items_authenticated_select on public.return_request_items for select to authenticated
using (
  exists (
    select 1 from public.return_requests r
    where r.id = return_request_id and r.user_id = (select auth.uid())
  )
  or (select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[]))
);

drop policy return_status_history_customer_select on public.return_status_history;
drop policy return_status_history_staff_select on public.return_status_history;
create policy return_status_history_authenticated_select on public.return_status_history for select to authenticated
using (
  exists (
    select 1 from public.return_requests r
    where r.id = return_request_id and r.user_id = (select auth.uid())
  )
  or (select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[]))
);
