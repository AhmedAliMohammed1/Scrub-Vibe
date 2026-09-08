create type public.discount_type as enum ('percentage', 'fixed');

create table public.discount_campaigns (
  id bigint generated always as identity primary key,
  name_en text not null check (char_length(trim(name_en)) between 2 and 120),
  name_ar text not null check (char_length(trim(name_ar)) between 2 and 120),
  description_en text,
  description_ar text,
  channel text not null default 'other' check (channel in ('instagram', 'facebook', 'tiktok', 'whatsapp', 'email', 'influencer', 'offline', 'other')),
  utm_campaign text check (utm_campaign is null or (char_length(utm_campaign) between 1 and 150 and utm_campaign ~ '^[A-Za-z0-9._-]+$')),
  budget_minor bigint check (budget_minor is null or budget_minor > 0),
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_campaigns_date_range check (ends_on >= starts_on)
);

create table public.discount_codes (
  id bigint generated always as identity primary key,
  campaign_id bigint references public.discount_campaigns(id) on delete set null,
  code text not null unique check (
    code = upper(code)
    and char_length(code) between 3 and 32
    and code ~ '^[A-Z0-9][A-Z0-9_-]*$'
  ),
  discount_type public.discount_type not null,
  value integer not null check (value > 0),
  minimum_subtotal_minor bigint not null default 0 check (minimum_subtotal_minor >= 0),
  maximum_discount_minor bigint check (maximum_discount_minor is null or maximum_discount_minor > 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_customer_limit integer not null default 1 check (per_customer_limit between 1 and 100),
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_codes_value_valid check (
    (discount_type = 'percentage' and value between 1 and 10000)
    or (discount_type = 'fixed' and value <= 100000000)
  ),
  constraint discount_codes_maximum_valid check (
    discount_type = 'percentage' or maximum_discount_minor is null
  ),
  constraint discount_codes_date_range check (
    starts_on is null or ends_on is null or ends_on >= starts_on
  )
);

alter table public.orders
  add column discount_code_id bigint references public.discount_codes(id) on delete set null,
  add column discount_code text,
  add column discount_campaign_id bigint references public.discount_campaigns(id) on delete set null,
  add column discount_campaign_name_en text,
  add column discount_campaign_name_ar text,
  add constraint orders_discount_valid check (discount_minor <= subtotal_minor);

create table public.discount_redemptions (
  id bigint generated always as identity primary key,
  discount_code_id bigint not null references public.discount_codes(id) on delete restrict,
  campaign_id bigint references public.discount_campaigns(id) on delete set null,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  discount_minor bigint not null check (discount_minor > 0),
  redeemed_at timestamptz not null default now()
);

create index discount_campaigns_schedule_idx on public.discount_campaigns (is_active, starts_on, ends_on);
create index discount_codes_campaign_idx on public.discount_codes (campaign_id, is_active);
create index discount_codes_schedule_idx on public.discount_codes (is_active, starts_on, ends_on);
create index discount_redemptions_code_idx on public.discount_redemptions (discount_code_id, redeemed_at desc);
create index discount_redemptions_campaign_idx on public.discount_redemptions (campaign_id, redeemed_at desc) where campaign_id is not null;
create index discount_redemptions_user_idx on public.discount_redemptions (user_id, redeemed_at desc) where user_id is not null;

alter table public.discount_campaigns enable row level security;
alter table public.discount_codes enable row level security;
alter table public.discount_redemptions enable row level security;

revoke all on public.discount_campaigns, public.discount_codes, public.discount_redemptions from anon, authenticated;
grant select, insert, update, delete on public.discount_campaigns, public.discount_codes to authenticated;
grant select on public.discount_redemptions to authenticated;
grant usage, select on sequence public.discount_campaigns_id_seq, public.discount_codes_id_seq, public.discount_redemptions_id_seq to authenticated;

create policy discount_campaigns_admin_all on public.discount_campaigns
for all to authenticated
using ((select private.has_any_role(array['admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['admin','super_admin']::public.app_role[])));

create policy discount_codes_admin_all on public.discount_codes
for all to authenticated
using ((select private.has_any_role(array['admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['admin','super_admin']::public.app_role[])));

create policy discount_redemptions_staff_select on public.discount_redemptions
for select to authenticated
using ((select private.has_any_role(array['analyst','admin','super_admin']::public.app_role[])));

create or replace function private.discount_amount(
  p_type public.discount_type,
  p_value integer,
  p_maximum bigint,
  p_subtotal bigint,
  p_cod_deposit bigint default 0
)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select greatest(
    0::bigint,
    least(
      greatest(p_subtotal - p_cod_deposit, 0::bigint),
      case
        when p_type = 'percentage' then
          least((p_subtotal * p_value) / 10000, coalesce(p_maximum, p_subtotal))
        else least(p_value::bigint, p_subtotal)
      end
    )
  );
$$;

revoke all on function private.discount_amount(public.discount_type, integer, bigint, bigint, bigint) from public, anon, authenticated;

create or replace function public.preview_discount_code(
  p_code text,
  p_items jsonb,
  p_payment_method text default 'vodafone_cash',
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code public.discount_codes%rowtype;
  v_campaign public.discount_campaigns%rowtype;
  v_item jsonb;
  v_variant record;
  v_subtotal bigint := 0;
  v_cod_deposit bigint := 0;
  v_discount bigint;
  v_usage integer;
  v_customer_usage integer;
  v_campaign_spend bigint;
  v_item_count integer := 0;
  v_today date := (now() at time zone 'Africa/Cairo')::date;
begin
  select * into v_code from public.discount_codes where code = upper(trim(p_code));
  if v_code.id is null then raise exception 'DISCOUNT_CODE_INVALID' using errcode = 'P0001'; end if;
  if not v_code.is_active then raise exception 'DISCOUNT_CODE_INACTIVE' using errcode = 'P0001'; end if;
  if (v_code.starts_on is not null and v_today < v_code.starts_on)
     or (v_code.ends_on is not null and v_today > v_code.ends_on) then
    raise exception 'DISCOUNT_CODE_EXPIRED' using errcode = 'P0001';
  end if;

  if v_code.campaign_id is not null then
    select * into v_campaign from public.discount_campaigns where id = v_code.campaign_id;
    if v_campaign.id is null or not v_campaign.is_active
       or v_today < v_campaign.starts_on or v_today > v_campaign.ends_on then
      raise exception 'DISCOUNT_CAMPAIGN_INACTIVE' using errcode = 'P0001';
    end if;
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_item_count := v_item_count + 1;
    if v_item_count > 30 then raise exception 'TOO_MANY_ORDER_LINES' using errcode = 'P0001'; end if;
    select coalesce(pv.price_override_minor, p.base_price_minor) as price_minor,
           p.cod_deposit_minor
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = (v_item ->> 'variant_id')::bigint
      and pv.is_active and p.status = 'active' and p.published_at <= now();
    if v_variant.price_minor is null then raise exception 'VARIANT_UNAVAILABLE' using errcode = 'P0001'; end if;
    if (v_item ->> 'quantity')::integer not between 1 and 10 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;
    v_subtotal := v_subtotal + v_variant.price_minor * (v_item ->> 'quantity')::integer;
    if p_payment_method = 'cod' then
      v_cod_deposit := v_cod_deposit + v_variant.cod_deposit_minor * (v_item ->> 'quantity')::integer;
    end if;
  end loop;
  if v_item_count = 0 then raise exception 'EMPTY_ORDER' using errcode = 'P0001'; end if;
  if v_subtotal < v_code.minimum_subtotal_minor then
    raise exception 'DISCOUNT_MINIMUM_NOT_MET' using errcode = 'P0001';
  end if;

  select count(*)::integer into v_usage from public.discount_redemptions where discount_code_id = v_code.id;
  if v_code.usage_limit is not null and v_usage >= v_code.usage_limit then
    raise exception 'DISCOUNT_USAGE_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  if nullif(trim(p_phone), '') is not null then
    select count(*)::integer into v_customer_usage
    from public.discount_redemptions dr join public.orders o on o.id = dr.order_id
    where dr.discount_code_id = v_code.id and o.phone = trim(p_phone);
    if v_customer_usage >= v_code.per_customer_limit then
      raise exception 'DISCOUNT_CUSTOMER_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;

  v_discount := private.discount_amount(v_code.discount_type, v_code.value,
    v_code.maximum_discount_minor, v_subtotal, v_cod_deposit);
  if v_discount <= 0 then raise exception 'DISCOUNT_NOT_APPLICABLE' using errcode = 'P0001'; end if;
  if v_campaign.id is not null and v_campaign.budget_minor is not null then
    select coalesce(sum(discount_minor), 0) into v_campaign_spend
    from public.discount_redemptions where campaign_id = v_campaign.id;
    if v_campaign_spend + v_discount > v_campaign.budget_minor then
      raise exception 'DISCOUNT_CAMPAIGN_BUDGET_EXHAUSTED' using errcode = 'P0001';
    end if;
  end if;

  return jsonb_build_object(
    'code', v_code.code,
    'discount_type', v_code.discount_type,
    'discount_minor', v_discount,
    'subtotal_minor', v_subtotal,
    'discounted_subtotal_minor', v_subtotal - v_discount,
    'campaign_name_en', v_campaign.name_en,
    'campaign_name_ar', v_campaign.name_ar
  );
end;
$$;

revoke execute on function public.preview_discount_code(text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.preview_discount_code(text, jsonb, text, text) to service_role;

create or replace function public.create_promotional_order(
  p_verification_token_hash text,
  p_tracking_token_hash text,
  p_user_id uuid,
  p_order jsonb,
  p_proof_path text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_order public.orders%rowtype;
  v_code public.discount_codes%rowtype;
  v_campaign public.discount_campaigns%rowtype;
  v_zone public.shipping_zones%rowtype;
  v_code_text text := upper(trim(coalesce(p_order ->> 'discount_code', '')));
  v_discount bigint;
  v_usage integer;
  v_customer_usage integer;
  v_campaign_spend bigint;
  v_shipping_discount bigint := 0;
  v_shipping bigint;
  v_total bigint;
  v_today date := (now() at time zone 'Africa/Cairo')::date;
begin
  v_result := public.create_verified_order(
    p_verification_token_hash, p_tracking_token_hash, p_user_id, p_order, p_proof_path
  );
  if v_code_text = '' then return v_result; end if;

  select * into v_order from public.orders where id = (v_result ->> 'id')::uuid for update;
  select * into v_code from public.discount_codes where code = v_code_text for update;
  if v_code.id is null then raise exception 'DISCOUNT_CODE_INVALID' using errcode = 'P0001'; end if;
  if not v_code.is_active then raise exception 'DISCOUNT_CODE_INACTIVE' using errcode = 'P0001'; end if;
  if (v_code.starts_on is not null and v_today < v_code.starts_on)
     or (v_code.ends_on is not null and v_today > v_code.ends_on) then
    raise exception 'DISCOUNT_CODE_EXPIRED' using errcode = 'P0001';
  end if;

  if v_code.campaign_id is not null then
    select * into v_campaign from public.discount_campaigns where id = v_code.campaign_id for update;
    if v_campaign.id is null or not v_campaign.is_active
       or v_today < v_campaign.starts_on or v_today > v_campaign.ends_on then
      raise exception 'DISCOUNT_CAMPAIGN_INACTIVE' using errcode = 'P0001';
    end if;
  end if;
  if v_order.subtotal_minor < v_code.minimum_subtotal_minor then
    raise exception 'DISCOUNT_MINIMUM_NOT_MET' using errcode = 'P0001';
  end if;

  select count(*)::integer into v_usage from public.discount_redemptions where discount_code_id = v_code.id;
  if v_code.usage_limit is not null and v_usage >= v_code.usage_limit then
    raise exception 'DISCOUNT_USAGE_LIMIT_REACHED' using errcode = 'P0001';
  end if;
  select count(*)::integer into v_customer_usage
  from public.discount_redemptions dr join public.orders o on o.id = dr.order_id
  where dr.discount_code_id = v_code.id and o.phone = v_order.phone;
  if v_customer_usage >= v_code.per_customer_limit then
    raise exception 'DISCOUNT_CUSTOMER_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  v_discount := private.discount_amount(v_code.discount_type, v_code.value,
    v_code.maximum_discount_minor, v_order.subtotal_minor,
    case when v_order.payment_method = 'cod' then v_order.cod_deposit_minor else 0 end);
  if v_discount <= 0 then raise exception 'DISCOUNT_NOT_APPLICABLE' using errcode = 'P0001'; end if;
  if v_campaign.id is not null and v_campaign.budget_minor is not null then
    select coalesce(sum(discount_minor), 0) into v_campaign_spend
    from public.discount_redemptions where campaign_id = v_campaign.id;
    if v_campaign_spend + v_discount > v_campaign.budget_minor then
      raise exception 'DISCOUNT_CAMPAIGN_BUDGET_EXHAUSTED' using errcode = 'P0001';
    end if;
  end if;

  select * into v_zone from public.shipping_zones where id = v_order.shipping_zone_id;
  if v_zone.free_shipping_threshold_minor is not null
     and v_order.subtotal_minor - v_discount >= v_zone.free_shipping_threshold_minor then
    v_shipping_discount := v_order.shipping_base_minor;
  end if;
  v_shipping := v_order.shipping_base_minor - v_shipping_discount + v_order.cod_surcharge_minor;
  v_total := v_order.subtotal_minor - v_discount + v_shipping;

  update public.orders set
    discount_code_id = v_code.id,
    discount_code = v_code.code,
    discount_campaign_id = v_campaign.id,
    discount_campaign_name_en = v_campaign.name_en,
    discount_campaign_name_ar = v_campaign.name_ar,
    discount_minor = v_discount,
    shipping_discount_minor = v_shipping_discount,
    shipping_minor = v_shipping,
    total_minor = v_total,
    cod_balance_due_minor = case when payment_method = 'cod' then v_total - cod_deposit_minor else 0 end,
    updated_at = now()
  where id = v_order.id;

  update public.payment_proofs set amount_minor = case
    when v_order.payment_method = 'cod' then v_order.cod_deposit_minor else v_total end
  where order_id = v_order.id;

  insert into public.discount_redemptions (
    discount_code_id, campaign_id, order_id, user_id, subtotal_minor, discount_minor
  ) values (v_code.id, v_campaign.id, v_order.id, p_user_id, v_order.subtotal_minor, v_discount);

  update public.order_status_history set note = concat_ws(' · ', note, 'Discount ', v_code.code, ' applied')
  where id = (select max(id) from public.order_status_history where order_id = v_order.id);

  return v_result || jsonb_build_object(
    'discount_code', v_code.code,
    'discount_minor', v_discount,
    'shipping_minor', v_shipping,
    'shipping_discount_minor', v_shipping_discount,
    'total_minor', v_total,
    'cod_balance_due_minor', case when v_order.payment_method = 'cod' then v_total - v_order.cod_deposit_minor else 0 end
  );
end;
$$;

revoke execute on function public.create_promotional_order(text, text, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_promotional_order(text, text, uuid, jsonb, text) to service_role;
