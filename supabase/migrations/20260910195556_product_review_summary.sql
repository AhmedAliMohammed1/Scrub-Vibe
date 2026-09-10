create or replace function public.get_product_review_summary(p_product_id bigint)
returns table (
  review_count bigint,
  average_rating numeric,
  recommend_percentage numeric,
  five_star_count bigint,
  four_star_count bigint,
  three_star_count bigint,
  two_star_count bigint,
  one_star_count bigint,
  runs_small_count bigint,
  true_to_size_count bigint,
  runs_large_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*)::bigint,
    coalesce(round(avg(rating)::numeric, 1), 0),
    coalesce(round(100.0 * count(*) filter (where would_recommend) / nullif(count(*), 0), 0), 0),
    count(*) filter (where rating = 5)::bigint,
    count(*) filter (where rating = 4)::bigint,
    count(*) filter (where rating = 3)::bigint,
    count(*) filter (where rating = 2)::bigint,
    count(*) filter (where rating = 1)::bigint,
    count(*) filter (where fit_feedback = 'runs_small')::bigint,
    count(*) filter (where fit_feedback = 'true_to_size')::bigint,
    count(*) filter (where fit_feedback = 'runs_large')::bigint
  from public.product_reviews
  where product_id = p_product_id and status = 'approved';
$$;

revoke execute on function public.get_product_review_summary(bigint) from public;
grant execute on function public.get_product_review_summary(bigint) to anon, authenticated;
