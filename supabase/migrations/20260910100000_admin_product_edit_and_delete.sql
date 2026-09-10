-- Migration: Add functions to update all product details and permanently delete products
-- with safe order-item snapshot retention and inventory movement cleanup.

create or replace function public.admin_delete_product(p_product_id bigint)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_variant_ids bigint[];
begin
  if not (select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Product not found';
  end if;

  -- Collect all variant IDs for this product
  select coalesce(array_agg(id), array[]::bigint[]) into v_variant_ids
  from public.product_variants
  where product_id = p_product_id;

  -- Remove inventory movements for variants of this product to satisfy foreign key constraint on delete restrict
  if cardinality(v_variant_ids) > 0 then
    delete from public.inventory_movements
    where variant_id = any(v_variant_ids);
  end if;

  -- Delete the product itself.
  -- This cascades to:
  --   product_translations
  --   product_images
  --   product_options & product_option_values
  --   product_variants (and inventory, product_variant_values)
  --   size_chart_entries
  --   cart_items
  --   wishlist_items
  --   stock_subscriptions
  --   product_recommendations
  -- And sets null on:
  --   order_items.product_id and variant_id
  --   analytics_events.product_id
  delete from public.products
  where id = p_product_id;

  return true;
end;
$$;

revoke execute on function public.admin_delete_product(bigint) from public, anon;
grant execute on function public.admin_delete_product(bigint) to authenticated;

create or replace function public.admin_update_product(
  p_product_id bigint,
  p_slug text,
  p_title_en text,
  p_title_ar text,
  p_base_price_minor bigint,
  p_category_id bigint,
  p_gender text,
  p_sizes text[],
  p_status public.product_status,
  p_description_en text,
  p_description_ar text,
  p_compare_at_price_minor bigint,
  p_cost_minor bigint,
  p_cod_deposit_minor bigint,
  p_material text,
  p_fit text,
  p_colours jsonb,
  p_image_url text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_colour_option_id bigint;
  v_size_option_id bigint;
  v_colour_value_id bigint;
  v_size_value_id bigint;
  v_variant_id bigint;
  v_colour jsonb;
  v_colour_code text;
  v_size text;
  v_size_code text;
  v_sku_prefix text;
  v_position integer := 0;
  v_active_variant_ids bigint[] := array[]::bigint[];
  v_target_sku text;
begin
  if not (select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Product not found';
  end if;

  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or char_length(trim(p_title_en)) not between 2 and 140
    or char_length(trim(p_title_ar)) not between 2 and 140
    or p_base_price_minor < 0
    or (p_compare_at_price_minor is not null and p_compare_at_price_minor < p_base_price_minor)
    or (p_cost_minor is not null and p_cost_minor < 0)
    or (p_cod_deposit_minor is not null and p_cod_deposit_minor > p_base_price_minor)
    or cardinality(p_sizes) not between 1 and 20
    or jsonb_typeof(p_colours) <> 'array'
    or jsonb_array_length(p_colours) not between 1 and 12
    or p_gender not in ('men', 'women', 'boys', 'girls', 'unisex') then
    raise exception 'Invalid product data';
  end if;

  if not exists (select 1 from public.categories where id = p_category_id) then
    raise exception 'Category not found';
  end if;

  if exists (select 1 from public.products where slug = p_slug and id <> p_product_id) then
    raise exception 'Product slug already exists' using errcode = '23505';
  end if;

  if (
    select count(distinct lower(trim(value->>'code'))) <> count(*)
    from jsonb_array_elements(p_colours)
  ) then
    raise exception 'Colour codes must be unique';
  end if;

  -- Update products table
  update public.products
  set
    category_id = p_category_id,
    slug = p_slug,
    status = p_status,
    gender = p_gender,
    material = nullif(trim(p_material), ''),
    fit = nullif(trim(p_fit), ''),
    base_price_minor = p_base_price_minor,
    compare_at_price_minor = p_compare_at_price_minor,
    cost_minor = p_cost_minor,
    cod_deposit_minor = coalesce(p_cod_deposit_minor, 0),
    published_at = case
      when p_status = 'active' and published_at is null then now()
      else published_at
    end,
    updated_at = now(),
    updated_by = auth.uid()
  where id = p_product_id;

  -- Upsert translations
  insert into public.product_translations (
    product_id, locale, title, description, seo_title, seo_description
  ) values
    (
      p_product_id, 'en', trim(p_title_en), nullif(trim(p_description_en), ''),
      trim(p_title_en) || ' | Scrub Vibe Egypt', nullif(trim(p_description_en), '')
    ),
    (
      p_product_id, 'ar', trim(p_title_ar), nullif(trim(p_description_ar), ''),
      trim(p_title_ar) || ' | سكراب فايب مصر', nullif(trim(p_description_ar), '')
    )
  on conflict (product_id, locale) do update set
    title = excluded.title,
    description = excluded.description,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description;

  -- Primary Image
  if nullif(trim(p_image_url), '') is not null then
    if exists (select 1 from public.product_images where product_id = p_product_id and position = 10) then
      update public.product_images
      set
        storage_path = trim(p_image_url),
        alt_en = trim(p_title_en),
        alt_ar = trim(p_title_ar)
      where product_id = p_product_id and position = 10;
    else
      insert into public.product_images (product_id, storage_path, alt_en, alt_ar, position)
      values (p_product_id, trim(p_image_url), trim(p_title_en), trim(p_title_ar), 10);
    end if;
  end if;

  -- Ensure color and size options exist
  select id into v_colour_option_id
  from public.product_options
  where product_id = p_product_id and code = 'color';

  if v_colour_option_id is null then
    insert into public.product_options (product_id, code, name_en, name_ar, position)
    values (p_product_id, 'color', 'Colour', 'اللون', 10)
    returning id into v_colour_option_id;
  end if;

  select id into v_size_option_id
  from public.product_options
  where product_id = p_product_id and code = 'size';

  if v_size_option_id is null then
    insert into public.product_options (product_id, code, name_en, name_ar, position)
    values (p_product_id, 'size', 'Size', 'المقاس', 20)
    returning id into v_size_option_id;
  end if;

  -- Synchronize colours
  for v_colour in select value from jsonb_array_elements(p_colours) loop
    v_colour_code := lower(trim(v_colour->>'code'));
    v_position := v_position + 10;
    if v_colour_code !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      or char_length(trim(v_colour->>'en')) not between 1 and 60
      or char_length(trim(v_colour->>'ar')) not between 1 and 60
      or (v_colour->>'hex') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'Invalid colour data';
    end if;

    select id into v_colour_value_id
    from public.product_option_values
    where option_id = v_colour_option_id and code = v_colour_code;

    if v_colour_value_id is not null then
      update public.product_option_values
      set
        label_en = trim(v_colour->>'en'),
        label_ar = trim(v_colour->>'ar'),
        swatch_hex = trim(v_colour->>'hex'),
        position = v_position
      where id = v_colour_value_id;
    else
      insert into public.product_option_values (
        option_id, code, label_en, label_ar, swatch_hex, position
      ) values (
        v_colour_option_id, v_colour_code, trim(v_colour->>'en'),
        trim(v_colour->>'ar'), trim(v_colour->>'hex'), v_position
      );
    end if;
  end loop;

  -- Synchronize sizes
  foreach v_size in array p_sizes loop
    v_size := trim(v_size);
    if v_size = '' or char_length(v_size) > 20 then
      raise exception 'Invalid product size';
    end if;
    v_size_code := lower(regexp_replace(v_size, '[^a-zA-Z0-9]+', '-', 'g'));

    select id into v_size_value_id
    from public.product_option_values
    where option_id = v_size_option_id and code = v_size_code;

    if v_size_value_id is not null then
      update public.product_option_values
      set
        label_en = v_size,
        label_ar = v_size,
        position = array_position(p_sizes, v_size) * 10
      where id = v_size_value_id;
    else
      insert into public.product_option_values (
        option_id, code, label_en, label_ar, position
      ) values (
        v_size_option_id, v_size_code, v_size, v_size,
        array_position(p_sizes, v_size) * 10
      );
    end if;
  end loop;

  -- Synchronize variants
  v_sku_prefix := upper(regexp_replace(p_slug, '[^a-zA-Z0-9]+', '-', 'g'));

  for v_colour in select value from jsonb_array_elements(p_colours) loop
    v_colour_code := lower(trim(v_colour->>'code'));
    select id into v_colour_value_id
    from public.product_option_values
    where option_id = v_colour_option_id and code = v_colour_code;

    foreach v_size in array p_sizes loop
      v_size_code := lower(regexp_replace(trim(v_size), '[^a-zA-Z0-9]+', '-', 'g'));
      select id into v_size_value_id
      from public.product_option_values
      where option_id = v_size_option_id and code = v_size_code;

      -- Check if variant matching this colour and size option already exists
      select pv.id into v_variant_id
      from public.product_variants pv
      join public.product_variant_values pvv1 on pvv1.variant_id = pv.id and pvv1.option_value_id = v_colour_value_id
      join public.product_variant_values pvv2 on pvv2.variant_id = pv.id and pvv2.option_value_id = v_size_value_id
      where pv.product_id = p_product_id
      limit 1;

      v_target_sku := 'SV-' || v_sku_prefix || '-' || upper(v_colour_code) || '-' || upper(v_size_code);

      if v_variant_id is not null then
        update public.product_variants
        set is_active = true, sku = v_target_sku
        where id = v_variant_id;
        v_active_variant_ids := array_append(v_active_variant_ids, v_variant_id);
      else
        insert into public.product_variants (product_id, sku, is_active)
        values (p_product_id, v_target_sku, true)
        returning id into v_variant_id;

        insert into public.product_variant_values (variant_id, option_value_id)
        values (v_variant_id, v_colour_value_id), (v_variant_id, v_size_value_id);

        insert into public.inventory (variant_id, on_hand, low_stock_threshold)
        values (v_variant_id, 10, 3)
        on conflict (variant_id) do nothing;

        v_active_variant_ids := array_append(v_active_variant_ids, v_variant_id);
      end if;
    end loop;
  end loop;

  -- Deactivate variants of this product that are no longer in the active colour/size matrix
  update public.product_variants
  set is_active = false
  where product_id = p_product_id and not (id = any(v_active_variant_ids));

  return true;
end;
$$;

revoke execute on function public.admin_update_product(bigint, text, text, text, bigint, bigint, text, text[], public.product_status, text, text, bigint, bigint, bigint, text, text, jsonb, text) from public, anon;
grant execute on function public.admin_update_product(bigint, text, text, text, bigint, bigint, text, text[], public.product_status, text, text, bigint, bigint, bigint, text, text, jsonb, text) to authenticated;
