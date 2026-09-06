create type public.order_status as enum (
  'awaiting_payment', 'payment_review', 'confirmed', 'processing',
  'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered',
  'cancelled', 'returned'
);
create type public.payment_status as enum (
  'pending', 'proof_submitted', 'paid', 'rejected', 'failed',
  'cod_due', 'cod_collected', 'refunded'
);
create type public.payment_method as enum (
  'cod', 'vodafone_cash', 'instapay', 'paymob'
);

create table public.checkout_otp_requests (
  id bigint generated always as identity primary key,
  phone text not null check (phone ~ '^\+20(10|11|12|15)[0-9]{8}$'),
  ip_hash text,
  provider_request_id text,
  created_at timestamptz not null default now()
);
create index checkout_otp_requests_phone_created_idx
  on public.checkout_otp_requests (phone, created_at desc);
create index checkout_otp_requests_ip_created_idx
  on public.checkout_otp_requests (ip_hash, created_at desc)
  where ip_hash is not null;

create table public.checkout_phone_verifications (
  id uuid primary key default gen_random_uuid(),
  phone text not null check (phone ~ '^\+20(10|11|12|15)[0-9]{8}$'),
  token_hash text not null unique,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > verified_at)
);
create index checkout_phone_verifications_expiry_idx
  on public.checkout_phone_verifications (expires_at)
  where consumed_at is null;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  tracking_token_hash text not null unique,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  email text check (email is null or char_length(email) <= 254),
  phone text not null check (phone ~ '^\+20(10|11|12|15)[0-9]{8}$'),
  phone_verified_at timestamptz not null,
  governorate text not null check (char_length(governorate) between 2 and 80),
  city text not null check (char_length(city) between 2 and 100),
  street_address text not null check (char_length(street_address) between 5 and 300),
  building text check (building is null or char_length(building) <= 50),
  floor text check (floor is null or char_length(floor) <= 30),
  apartment text check (apartment is null or char_length(apartment) <= 30),
  landmark text check (landmark is null or char_length(landmark) <= 200),
  customer_notes text check (customer_notes is null or char_length(customer_notes) <= 1000),
  status public.order_status not null,
  payment_status public.payment_status not null,
  payment_method public.payment_method not null,
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  total_minor bigint not null default 0 check (total_minor >= 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  shipment_number text check (shipment_number is null or char_length(shipment_number) <= 120),
  courier text check (courier is null or char_length(courier) <= 120),
  tracking_url text check (tracking_url is null or char_length(tracking_url) <= 1000),
  paymob_intention_id text,
  paymob_order_id text,
  paymob_transaction_id text,
  reservation_expires_at timestamptz,
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_created_idx on public.orders (user_id, created_at desc)
  where user_id is not null;
create index orders_phone_created_idx on public.orders (phone, created_at desc);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_payment_status_created_idx on public.orders (payment_status, created_at desc);
create index orders_reservation_expiry_idx on public.orders (reservation_expires_at)
  where status in ('awaiting_payment', 'payment_review');

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id bigint references public.products(id) on delete set null,
  variant_id bigint references public.product_variants(id) on delete set null,
  sku text not null,
  title_en text not null,
  title_ar text not null,
  colour_code text,
  colour_en text,
  colour_ar text,
  size text,
  image_url text,
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total_minor bigint generated always as (unit_price_minor * quantity) stored,
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id)
  where product_id is not null;

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete restrict,
  status public.order_status not null,
  payment_status public.payment_status not null,
  note text check (note is null or char_length(note) <= 500),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_created_idx
  on public.order_status_history (order_id, created_at);

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  storage_path text not null unique,
  submitted_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references auth.users(id) on delete set null,
  review_note text check (review_note is null or char_length(review_note) <= 500),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index payment_proofs_order_created_idx
  on public.payment_proofs (order_id, created_at desc);

alter table public.checkout_otp_requests enable row level security;
alter table public.checkout_phone_verifications enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payment_proofs enable row level security;

revoke all on public.checkout_otp_requests, public.checkout_phone_verifications from anon, authenticated;
revoke all on public.orders, public.order_items, public.order_status_history, public.payment_proofs from anon, authenticated;
grant select on public.orders, public.order_items, public.order_status_history to authenticated;
grant select, update on public.orders, public.payment_proofs to authenticated;
grant insert on public.order_status_history to authenticated;

create policy orders_customer_select on public.orders for select to authenticated
using ((select auth.uid()) = user_id);
create policy orders_staff_select on public.orders for select to authenticated
using ((select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[])));
create policy orders_staff_update on public.orders for update to authenticated
using ((select private.has_any_role(array['support','warehouse','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['support','warehouse','admin','super_admin']::public.app_role[])));

create policy order_items_customer_select on public.order_items for select to authenticated
using (exists (
  select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
));
create policy order_items_staff_select on public.order_items for select to authenticated
using ((select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[])));

create policy order_history_customer_select on public.order_status_history for select to authenticated
using (exists (
  select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
));
create policy order_history_staff_select on public.order_status_history for select to authenticated
using ((select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[])));
create policy order_history_staff_insert on public.order_status_history for insert to authenticated
with check (
  actor_id = (select auth.uid()) and
  (select private.has_any_role(array['support','warehouse','admin','super_admin']::public.app_role[]))
);

create policy payment_proofs_customer_select on public.payment_proofs for select to authenticated
using (exists (
  select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
));
create policy payment_proofs_staff_select on public.payment_proofs for select to authenticated
using ((select private.has_any_role(array['support','admin','super_admin']::public.app_role[])));
create policy payment_proofs_staff_update on public.payment_proofs for update to authenticated
using ((select private.has_any_role(array['support','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['support','admin','super_admin']::public.app_role[])));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs', 'payment-proofs', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy payment_proofs_storage_staff_read
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs' and
  (select private.has_any_role(array['support','admin','super_admin']::public.app_role[]))
);

create or replace function public.create_verified_order(
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
  v_verification public.checkout_phone_verifications%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_method public.payment_method;
  v_status public.order_status;
  v_payment_status public.payment_status;
  v_item jsonb;
  v_variant record;
  v_quantity integer;
  v_subtotal bigint := 0;
  v_shipping bigint := 0;
  v_available integer;
  v_item_count integer := 0;
begin
  select * into v_verification
  from public.checkout_phone_verifications
  where token_hash = p_verification_token_hash
  for update;

  if v_verification.id is null or v_verification.consumed_at is not null or v_verification.expires_at <= now() then
    raise exception 'PHONE_VERIFICATION_INVALID' using errcode = 'P0001';
  end if;
  if coalesce(p_order ->> 'phone', '') <> v_verification.phone then
    raise exception 'PHONE_VERIFICATION_MISMATCH' using errcode = 'P0001';
  end if;

  v_method := (p_order ->> 'payment_method')::public.payment_method;
  v_status := case
    when v_method = 'cod' then 'confirmed'::public.order_status
    when v_method in ('vodafone_cash', 'instapay') then 'payment_review'::public.order_status
    else 'awaiting_payment'::public.order_status
  end;
  v_payment_status := case
    when v_method = 'cod' then 'cod_due'::public.payment_status
    when v_method in ('vodafone_cash', 'instapay') then 'proof_submitted'::public.payment_status
    else 'pending'::public.payment_status
  end;

  if v_method in ('vodafone_cash', 'instapay') and coalesce(p_proof_path, '') = '' then
    raise exception 'PAYMENT_PROOF_REQUIRED' using errcode = 'P0001';
  end if;

  v_order_number := 'SV-' || to_char(now() at time zone 'Africa/Cairo', 'YYMMDD') || '-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 6));

  insert into public.orders (
    id, order_number, user_id, tracking_token_hash, customer_name, email, phone,
    phone_verified_at, governorate, city, street_address, building, floor,
    apartment, landmark, customer_notes, status, payment_status, payment_method,
    reservation_expires_at
  ) values (
    v_order_id, v_order_number, p_user_id, p_tracking_token_hash,
    trim(p_order ->> 'customer_name'), nullif(trim(p_order ->> 'email'), ''),
    v_verification.phone, v_verification.verified_at, trim(p_order ->> 'governorate'),
    trim(p_order ->> 'city'), trim(p_order ->> 'street_address'),
    nullif(trim(p_order ->> 'building'), ''), nullif(trim(p_order ->> 'floor'), ''),
    nullif(trim(p_order ->> 'apartment'), ''), nullif(trim(p_order ->> 'landmark'), ''),
    nullif(trim(p_order ->> 'customer_notes'), ''), v_status, v_payment_status, v_method,
    case when v_method = 'paymob' then now() + interval '30 minutes'
         when v_method in ('vodafone_cash', 'instapay') then now() + interval '24 hours'
         else null end
  );

  for v_item in select value from jsonb_array_elements(p_order -> 'items') loop
    v_item_count := v_item_count + 1;
    if v_item_count > 30 then raise exception 'TOO_MANY_ORDER_LINES' using errcode = 'P0001'; end if;
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity < 1 or v_quantity > 10 then raise exception 'INVALID_QUANTITY' using errcode = 'P0001'; end if;

    select
      pv.id as variant_id, pv.product_id, pv.sku,
      coalesce(pv.price_override_minor, p.base_price_minor) as price_minor,
      coalesce(en.title, p.slug) as title_en,
      coalesce(ar.title, en.title, p.slug) as title_ar,
      (select pov.code from public.product_variant_values pvv join public.product_option_values pov on pov.id = pvv.option_value_id join public.product_options po on po.id = pov.option_id where pvv.variant_id = pv.id and po.code = 'color' limit 1) as colour_code,
      (select pov.label_en from public.product_variant_values pvv join public.product_option_values pov on pov.id = pvv.option_value_id join public.product_options po on po.id = pov.option_id where pvv.variant_id = pv.id and po.code = 'color' limit 1) as colour_en,
      (select pov.label_ar from public.product_variant_values pvv join public.product_option_values pov on pov.id = pvv.option_value_id join public.product_options po on po.id = pov.option_id where pvv.variant_id = pv.id and po.code = 'color' limit 1) as colour_ar,
      (select pov.label_en from public.product_variant_values pvv join public.product_option_values pov on pov.id = pvv.option_value_id join public.product_options po on po.id = pov.option_id where pvv.variant_id = pv.id and po.code = 'size' limit 1) as size,
      (select pi.storage_path from public.product_images pi where pi.product_id = p.id order by pi.position, pi.id limit 1) as image_url
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    left join public.product_translations en on en.product_id = p.id and en.locale = 'en'
    left join public.product_translations ar on ar.product_id = p.id and ar.locale = 'ar'
    where pv.id = (v_item ->> 'variant_id')::bigint
      and pv.is_active and p.status = 'active' and p.published_at <= now();

    if v_variant.variant_id is null then raise exception 'VARIANT_UNAVAILABLE' using errcode = 'P0001'; end if;

    select on_hand - reserved into v_available
    from public.inventory where variant_id = v_variant.variant_id for update;
    if v_available is null or v_available < v_quantity then raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001'; end if;

    insert into public.order_items (
      order_id, product_id, variant_id, sku, title_en, title_ar, colour_code,
      colour_en, colour_ar, size, image_url, unit_price_minor, quantity
    ) values (
      v_order_id, v_variant.product_id, v_variant.variant_id, v_variant.sku,
      v_variant.title_en, v_variant.title_ar, v_variant.colour_code,
      v_variant.colour_en, v_variant.colour_ar, v_variant.size,
      v_variant.image_url, v_variant.price_minor, v_quantity
    );
    update public.inventory set reserved = reserved + v_quantity, updated_at = now()
    where variant_id = v_variant.variant_id;
    insert into public.inventory_movements (
      variant_id, movement_type, quantity_delta, reference_type, reference_id, reason
    ) values (
      v_variant.variant_id, 'reservation', v_quantity, 'order', v_order_id::text,
      'Reserved for ' || v_order_number
    );
    v_subtotal := v_subtotal + (v_variant.price_minor * v_quantity);
  end loop;

  if v_item_count = 0 then raise exception 'EMPTY_ORDER' using errcode = 'P0001'; end if;
  update public.orders set
    subtotal_minor = v_subtotal,
    shipping_minor = v_shipping,
    total_minor = v_subtotal + v_shipping,
    updated_at = now()
  where id = v_order_id;

  if p_proof_path is not null then
    insert into public.payment_proofs (order_id, storage_path, submitted_by)
    values (v_order_id, p_proof_path, p_user_id);
  end if;
  insert into public.order_status_history (order_id, status, payment_status, note)
  values (v_order_id, v_status, v_payment_status, 'Order created after phone verification');
  update public.checkout_phone_verifications set consumed_at = now() where id = v_verification.id;

  return jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number, 'subtotal_minor', v_subtotal,
    'shipping_minor', v_shipping, 'total_minor', v_subtotal + v_shipping,
    'status', v_status, 'payment_status', v_payment_status
  );
end;
$$;
revoke execute on function public.create_verified_order(text, text, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_verified_order(text, text, uuid, jsonb, text) to service_role;

create or replace function public.admin_update_order(
  p_order_id uuid,
  p_status public.order_status,
  p_payment_status public.payment_status,
  p_note text default null,
  p_shipment_number text default null,
  p_courier text default null,
  p_tracking_url text default null,
  p_proof_status text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous public.orders%rowtype;
  v_line record;
begin
  if v_actor is null or not (select private.has_any_role(array['support','warehouse','admin','super_admin']::public.app_role[])) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_proof_status is not null and p_proof_status not in ('pending', 'approved', 'rejected') then
    raise exception 'INVALID_PROOF_STATUS' using errcode = '22023';
  end if;
  if p_status in ('shipped', 'out_for_delivery') and coalesce(trim(p_shipment_number), '') = '' then
    raise exception 'SHIPMENT_NUMBER_REQUIRED' using errcode = '22023';
  end if;

  select * into v_previous from public.orders where id = p_order_id for update;
  if v_previous.id is null then raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_previous.status in ('cancelled', 'returned') and p_status <> v_previous.status then
    raise exception 'TERMINAL_ORDER' using errcode = 'P0001';
  end if;

  if p_status = 'cancelled' and v_previous.status not in ('cancelled', 'delivered', 'returned') then
    for v_line in select variant_id, quantity from public.order_items where order_id = p_order_id and variant_id is not null loop
      update public.inventory set reserved = greatest(0, reserved - v_line.quantity), updated_at = now()
      where variant_id = v_line.variant_id;
      insert into public.inventory_movements (variant_id, movement_type, quantity_delta, reference_type, reference_id, reason, actor_id)
      values (v_line.variant_id, 'release', -v_line.quantity, 'order', p_order_id::text, 'Order cancelled', v_actor);
    end loop;
  elsif p_status = 'delivered' and v_previous.status <> 'delivered' then
    for v_line in select variant_id, quantity from public.order_items where order_id = p_order_id and variant_id is not null loop
      update public.inventory set on_hand = on_hand - v_line.quantity, reserved = greatest(0, reserved - v_line.quantity), updated_at = now()
      where variant_id = v_line.variant_id and on_hand >= v_line.quantity;
      if not found then raise exception 'INSUFFICIENT_STOCK_AT_FULFILMENT' using errcode = 'P0001'; end if;
      insert into public.inventory_movements (variant_id, movement_type, quantity_delta, reference_type, reference_id, reason, actor_id)
      values (v_line.variant_id, 'sale', -v_line.quantity, 'order', p_order_id::text, 'Order delivered', v_actor);
    end loop;
  end if;

  update public.orders set
    status = p_status,
    payment_status = p_payment_status,
    shipment_number = nullif(trim(p_shipment_number), ''),
    courier = nullif(trim(p_courier), ''),
    tracking_url = nullif(trim(p_tracking_url), ''),
    paid_at = case when p_payment_status in ('paid', 'cod_collected') then coalesce(paid_at, now()) else paid_at end,
    shipped_at = case when p_status in ('shipped', 'out_for_delivery', 'delivered') then coalesce(shipped_at, now()) else shipped_at end,
    delivered_at = case when p_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end,
    cancelled_at = case when p_status = 'cancelled' then coalesce(cancelled_at, now()) else cancelled_at end,
    updated_at = now()
  where id = p_order_id;

  if p_proof_status is not null then
    update public.payment_proofs set
      status = p_proof_status,
      reviewer_id = v_actor,
      review_note = nullif(trim(p_note), ''),
      reviewed_at = now()
    where order_id = p_order_id and status = 'pending';
  end if;
  insert into public.order_status_history (order_id, status, payment_status, note, actor_id)
  values (p_order_id, p_status, p_payment_status, nullif(trim(p_note), ''), v_actor);
end;
$$;

revoke execute on function public.admin_update_order(uuid, public.order_status, public.payment_status, text, text, text, text, text) from public, anon;
grant execute on function public.admin_update_order(uuid, public.order_status, public.payment_status, text, text, text, text, text) to authenticated;

create or replace function public.process_paymob_callback(
  p_order_number text,
  p_transaction_id text,
  p_external_order_id text,
  p_success boolean,
  p_amount_minor bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where order_number = p_order_number for update;
  if v_order.id is null or v_order.payment_method <> 'paymob' then raise exception 'ORDER_NOT_FOUND'; end if;
  if p_success and p_amount_minor <> v_order.total_minor then raise exception 'PAYMENT_AMOUNT_MISMATCH'; end if;
  update public.orders set
    paymob_transaction_id = p_transaction_id,
    paymob_order_id = coalesce(p_external_order_id, paymob_order_id),
    payment_status = case when p_success then 'paid'::public.payment_status else 'failed'::public.payment_status end,
    status = case when p_success then 'confirmed'::public.order_status else status end,
    paid_at = case when p_success then coalesce(paid_at, now()) else paid_at end,
    reservation_expires_at = case when p_success then null else reservation_expires_at end,
    updated_at = now()
  where id = v_order.id;
  insert into public.order_status_history (order_id, status, payment_status, note)
  values (
    v_order.id,
    case when p_success then 'confirmed'::public.order_status else v_order.status end,
    case when p_success then 'paid'::public.payment_status else 'failed'::public.payment_status end,
    case when p_success then 'Payment confirmed by Paymob webhook' else 'Paymob payment failed' end
  );
end;
$$;
revoke execute on function public.process_paymob_callback(text, text, text, boolean, bigint) from public, anon, authenticated;
grant execute on function public.process_paymob_callback(text, text, text, boolean, bigint) to service_role;

grant usage, select on sequence public.checkout_otp_requests_id_seq to service_role;
grant usage, select on sequence public.order_items_id_seq, public.order_status_history_id_seq to authenticated;
