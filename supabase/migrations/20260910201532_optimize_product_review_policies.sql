create index product_reviews_responded_by_idx
  on public.product_reviews (responded_by)
  where responded_by is not null;

drop policy if exists product_reviews_public_approved_select on public.product_reviews;
drop policy if exists product_reviews_owner_select on public.product_reviews;
drop policy if exists product_reviews_staff_select on public.product_reviews;

create policy product_reviews_public_approved_select
on public.product_reviews for select to anon
using (status = 'approved');

create policy product_reviews_authenticated_select
on public.product_reviews for select to authenticated
using (
  status = 'approved'
  or (select auth.uid()) = user_id
  or (select private.has_any_role(array['content_editor','product_manager','analyst','support','admin','super_admin']::public.app_role[]))
);
