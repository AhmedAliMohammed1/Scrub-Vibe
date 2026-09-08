-- Fix sync_customer_cart_and_wishlist function:
-- Column pov.metadata does not exist on product_option_values (actual column is pov.swatch_hex).

create or replace function public.sync_customer_cart_and_wishlist(
  p_cart jsonb default '[]'::jsonb,
  p_wishlist bigint[] default array[]::bigint[]
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_cart_result jsonb;
  v_wishlist_result jsonb;
  v_item record;
  v_product_id bigint;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  -- 1. Ingest guest cart items
  if p_cart is not null and jsonb_array_length(p_cart) > 0 then
    for v_item in
      select
        coalesce((elem->>'variant_id')::bigint, 0) as variant_id,
        coalesce((elem->>'quantity')::int, 0) as quantity
      from jsonb_array_elements(p_cart) as elem
    loop
      if v_item.variant_id > 0 and v_item.quantity > 0 then
        insert into public.cart_items (user_id, variant_id, quantity)
        values (v_user_id, v_item.variant_id, least(greatest(v_item.quantity, 1), 10))
        on conflict (user_id, variant_id)
        do update set
          quantity = least(greatest(public.cart_items.quantity + excluded.quantity, 1), 10),
          updated_at = timezone('utc'::text, now());
      end if;
    end loop;
  end if;

  -- 2. Ingest guest wishlist items
  if p_wishlist is not null and array_length(p_wishlist, 1) > 0 then
    foreach v_product_id in array p_wishlist
    loop
      if v_product_id > 0 then
        insert into public.wishlist_items (user_id, product_id)
        values (v_user_id, v_product_id)
        on conflict (user_id, product_id) do nothing;
      end if;
    end loop;
  end if;

  -- 3. Return aggregated cart lines with variant + option details
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', ci.id,
      'variant_id', ci.variant_id,
      'product_id', p.id::text,
      'slug', p.slug,
      'quantity', ci.quantity,
      'price_minor', coalesce(pv.price_override_minor, p.base_price_minor),
      'cod_deposit_minor', p.cod_deposit_minor,
      'title_en', coalesce(en.title, p.slug),
      'title_ar', coalesce(ar.title, en.title, p.slug),
      'colour_code', (
        select pov.code
        from public.product_variant_values pvv
        join public.product_option_values pov on pov.id = pvv.option_value_id
        join public.product_options po on po.id = pov.option_id
        where pvv.variant_id = pv.id and po.code = 'color'
        limit 1
      ),
      'colour_en', (
        select pov.label_en
        from public.product_variant_values pvv
        join public.product_option_values pov on pov.id = pvv.option_value_id
        join public.product_options po on po.id = pov.option_id
        where pvv.variant_id = pv.id and po.code = 'color'
        limit 1
      ),
      'colour_ar', (
        select pov.label_ar
        from public.product_variant_values pvv
        join public.product_option_values pov on pov.id = pvv.option_value_id
        join public.product_options po on po.id = pov.option_id
        where pvv.variant_id = pv.id and po.code = 'color'
        limit 1
      ),
      'swatch', coalesce((
        select pov.swatch_hex
        from public.product_variant_values pvv
        join public.product_option_values pov on pov.id = pvv.option_value_id
        join public.product_options po on po.id = pov.option_id
        where pvv.variant_id = pv.id and po.code = 'color'
        limit 1
      ), '#171717'),
      'size', (
        select pov.label_en
        from public.product_variant_values pvv
        join public.product_option_values pov on pov.id = pvv.option_value_id
        join public.product_options po on po.id = pov.option_id
        where pvv.variant_id = pv.id and po.code = 'size'
        limit 1
      ),
      'image_url', (
        select pi.storage_path
        from public.product_images pi
        where pi.product_id = p.id
        order by pi.position, pi.id
        limit 1
      ),
      'available_stock', coalesce((
        select inv.on_hand - inv.reserved
        from public.inventory inv
        where inv.variant_id = pv.id
      ), 0)
    )
    order by ci.created_at asc
  ), '[]'::jsonb)
  into v_cart_result
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  join public.products p on p.id = pv.product_id
  left join public.product_translations en on en.product_id = p.id and en.locale = 'en'
  left join public.product_translations ar on ar.product_id = p.id and ar.locale = 'ar'
  where ci.user_id = v_user_id and pv.is_active and p.status = 'active';

  select coalesce(jsonb_agg(wi.product_id::text), '[]'::jsonb)
  into v_wishlist_result
  from public.wishlist_items wi
  join public.products p on p.id = wi.product_id
  where wi.user_id = v_user_id and p.status = 'active';

  return jsonb_build_object(
    'cart', v_cart_result,
    'wishlist', v_wishlist_result
  );
end;
$$;

revoke execute on function public.sync_customer_cart_and_wishlist(jsonb, bigint[]) from public, anon;
grant execute on function public.sync_customer_cart_and_wishlist(jsonb, bigint[]) to authenticated;
