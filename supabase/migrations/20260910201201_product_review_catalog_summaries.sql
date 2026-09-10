create view public.product_review_summaries
with (security_invoker = true)
as
select
  product_id,
  count(*)::bigint as review_count,
  round(avg(rating)::numeric, 1) as average_rating
from public.product_reviews
where status = 'approved'
group by product_id;

revoke all on public.product_review_summaries from public, anon, authenticated;
grant select on public.product_review_summaries to anon, authenticated;
