alter table public.products
  add column cod_deposit_minor bigint not null default 0,
  add constraint products_cod_deposit_valid
    check (cod_deposit_minor >= 0 and cod_deposit_minor <= base_price_minor);

alter table public.orders
  add column cod_deposit_minor bigint not null default 0,
  add column cod_balance_due_minor bigint not null default 0,
  add column cod_deposit_method text,
  add constraint orders_cod_deposit_valid
    check (cod_deposit_minor >= 0 and cod_balance_due_minor >= 0),
  add constraint orders_cod_deposit_method_valid
    check (cod_deposit_method is null or cod_deposit_method in ('vodafone_cash', 'instapay'));

alter table public.order_items
  add column cod_deposit_unit_minor bigint not null default 0,
  add column cod_deposit_line_minor bigint generated always as (cod_deposit_unit_minor * quantity) stored,
  add constraint order_items_cod_deposit_valid check (cod_deposit_unit_minor >= 0);

alter table public.payment_proofs
  add column amount_minor bigint not null default 0,
  add constraint payment_proofs_amount_valid check (amount_minor >= 0);

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
  v_cod_deposit bigint := 0;
  v_available integer;
  v_item_count integer := 0;
  v_deposit_method text;
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
  v_deposit_method := nullif(p_order ->> 'cod_deposit_method', '');
  if v_method = 'cod' and v_deposit_method not in ('vodafone_cash', 'instapay') then
    raise exception 'COD_DEPOSIT_METHOD_REQUIRED' using errcode = 'P0001';
  end if;
  if v_method <> 'cod' then v_deposit_method := null; end if;

  v_status := case
    when v_method in ('cod', 'vodafone_cash', 'instapay') then 'payment_review'::public.order_status
    else 'awaiting_payment'::public.order_status
  end;
  v_payment_status := case
    when v_method in ('cod', 'vodafone_cash', 'instapay') then 'proof_submitted'::public.payment_status
    else 'pending'::public.payment_status
  end;

  if v_method in ('cod', 'vodafone_cash', 'instapay') and coalesce(p_proof_path, '') = '' then
    raise exception 'PAYMENT_PROOF_REQUIRED' using errcode = 'P0001';
  end if;

  v_order_number := 'SV-' || to_char(now() at time zone 'Africa/Cairo', 'YYMMDD') || '-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 6));

  insert into public.orders (
    id, order_number, user_id, tracking_token_hash, customer_name, email, phone,
    phone_verified_at, governorate, city, street_address, building, floor,
    apartment, landmark, customer_notes, status, payment_status, payment_method,
    cod_deposit_method, reservation_expires_at
  ) values (
    v_order_id, v_order_number, p_user_id, p_tracking_token_hash,
    trim(p_order ->> 'customer_name'), nullif(trim(p_order ->> 'email'), ''),
    v_verification.phone, v_verification.verified_at, trim(p_order ->> 'governorate'),
    trim(p_order ->> 'city'), trim(p_order ->> 'street_address'),
    nullif(trim(p_order ->> 'building'), ''), nullif(trim(p_order ->> 'floor'), ''),
    nullif(trim(p_order ->> 'apartment'), ''), nullif(trim(p_order ->> 'landmark'), ''),
    nullif(trim(p_order ->> 'customer_notes'), ''), v_status, v_payment_status, v_method,
    v_deposit_method,
    case when v_method = 'paymob' then now() + interval '30 minutes'
         when v_method in ('cod', 'vodafone_cash', 'instapay') then now() + interval '24 hours'
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
      p.cod_deposit_minor,
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
    if v_method = 'cod' and v_variant.cod_deposit_minor <= 0 then
      raise exception 'COD_DEPOSIT_NOT_CONFIGURED' using errcode = 'P0001';
    end if;

    select on_hand - reserved into v_available
    from public.inventory where variant_id = v_variant.variant_id for update;
    if v_available is null or v_available < v_quantity then raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001'; end if;

    insert into public.order_items (
      order_id, product_id, variant_id, sku, title_en, title_ar, colour_code,
      colour_en, colour_ar, size, image_url, unit_price_minor, quantity,
      cod_deposit_unit_minor
    ) values (
      v_order_id, v_variant.product_id, v_variant.variant_id, v_variant.sku,
      v_variant.title_en, v_variant.title_ar, v_variant.colour_code,
      v_variant.colour_en, v_variant.colour_ar, v_variant.size,
      v_variant.image_url, v_variant.price_minor, v_quantity,
      case when v_method = 'cod' then v_variant.cod_deposit_minor else 0 end
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
    if v_method = 'cod' then
      v_cod_deposit := v_cod_deposit + (v_variant.cod_deposit_minor * v_quantity);
    end if;
  end loop;

  if v_item_count = 0 then raise exception 'EMPTY_ORDER' using errcode = 'P0001'; end if;
  update public.orders set
    subtotal_minor = v_subtotal,
    shipping_minor = v_shipping,
    total_minor = v_subtotal + v_shipping,
    cod_deposit_minor = v_cod_deposit,
    cod_balance_due_minor = case when v_method = 'cod' then v_subtotal + v_shipping - v_cod_deposit else 0 end,
    updated_at = now()
  where id = v_order_id;

  if p_proof_path is not null then
    insert into public.payment_proofs (order_id, storage_path, submitted_by, amount_minor)
    values (
      v_order_id, p_proof_path, p_user_id,
      case when v_method = 'cod' then v_cod_deposit else v_subtotal + v_shipping end
    );
  end if;
  insert into public.order_status_history (order_id, status, payment_status, note)
  values (
    v_order_id, v_status, v_payment_status,
    case when v_method = 'cod' then 'COD deposit submitted for review' else 'Order created after phone verification' end
  );
  update public.checkout_phone_verifications set consumed_at = now() where id = v_verification.id;

  return jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number, 'subtotal_minor', v_subtotal,
    'shipping_minor', v_shipping, 'total_minor', v_subtotal + v_shipping,
    'cod_deposit_minor', v_cod_deposit,
    'cod_balance_due_minor', case when v_method = 'cod' then v_subtotal + v_shipping - v_cod_deposit else 0 end,
    'status', v_status, 'payment_status', v_payment_status
  );
end;
$$;
