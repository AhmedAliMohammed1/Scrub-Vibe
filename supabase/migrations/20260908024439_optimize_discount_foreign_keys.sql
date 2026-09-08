create index discount_campaigns_created_by_idx
  on public.discount_campaigns (created_by)
  where created_by is not null;

create index discount_codes_created_by_idx
  on public.discount_codes (created_by)
  where created_by is not null;

create index orders_discount_code_created_idx
  on public.orders (discount_code_id, created_at desc)
  where discount_code_id is not null;

create index orders_discount_campaign_created_idx
  on public.orders (discount_campaign_id, created_at desc)
  where discount_campaign_id is not null;
