-- A single consolidated request per order prevents customers from requesting
-- more units than were purchased across concurrent return cases.
create unique index return_requests_one_per_order_idx
  on public.return_requests(order_id);
