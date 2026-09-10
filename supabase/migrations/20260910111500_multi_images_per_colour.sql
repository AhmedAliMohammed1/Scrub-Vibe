-- Migration: Support multiple product images per product and colour-specific image tagging
-- Allows admins to assign images to specific colours or general (all colours),
-- with position ordering and graceful storefront fallback.

-- 1. Add colour_code column to product_images if it doesn't exist
alter table public.product_images
add column if not exists colour_code text default null;

create index if not exists product_images_product_colour_idx
on public.product_images(product_id, colour_code, position);

-- 2. Update admin_update_product with p_images support
create or replace function public.admin_update_product(
  p_product_id bigint,
  p_slug text,
  p_title_en text,
  p_title_ar text,
  p_description_en text,
  p_description_ar text,
  p_category_id bigint,
  p_gender text,
  p_status public.product_status,
  p_base_price_minor bigint,
  p_compare_at_price_minor bigint default null,
  p_cost_minor bigint default null,
  p_cod_deposit_minor bigint default null,
  p_material text default null,
  p_fit text default null,
  p_colours jsonb default '[]'::jsonb,
  p_sizes text[] default '{}'::text[],
  p_image_url text default null,
  p_images jsonb default null
)
returns boolean
language plpgsql
security definer
set search_path = public, private
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

  -- Multi-images handling variables
  v_kept_image_ids bigint[] := array[]::bigint[];
  v_img jsonb;
  v_img_id bigint;
  v_img_path text;
  v_img_colour text;
  v_img_pos integer;
  v_img_alt_en text;
  v_img_alt_ar text;
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

  -- Multi-images handling
  if p_images is not null and jsonb_typeof(p_images) = 'array' then
    -- Collect IDs of existing images that should be retained
    select coalesce(array_agg((elem->>'id')::bigint), array[]::bigint[])
    into v_kept_image_ids
    from jsonb_array_elements(p_images) as elem
    where elem->>'id' is not null and (elem->>'id') ~ '^[0-9]+$';

    -- Delete images that were removed in the edit form
    if cardinality(v_kept_image_ids) > 0 then
      delete from public.product_images
      where product_id = p_product_id and id <> all(v_kept_image_ids);
    else
      -- If array is empty, all images were deleted
      if jsonb_array_length(p_images) = 0 then
        delete from public.product_images where product_id = p_product_id;
      end if;
    end if;

    -- Upsert/insert each image in p_images
    for v_img in select value from jsonb_array_elements(p_images) loop
      v_img_id := nullif(trim(v_img->>'id'), '')::bigint;
      v_img_path := trim(coalesce(v_img->>'storage_path', v_img->>'src', ''));
      v_img_colour := nullif(trim(coalesce(v_img->>'colour_code', v_img->>'colourCode', '')), '');
      v_img_pos := coalesce((v_img->>'position')::integer, 10);
      v_img_alt_en := coalesce(nullif(trim(v_img->>'alt_en'), ''), trim(p_title_en));
      v_img_alt_ar := coalesce(nullif(trim(v_img->>'alt_ar'), ''), trim(p_title_ar));

      if v_img_path <> '' then
        if v_img_id is not null and exists (select 1 from public.product_images where id = v_img_id and product_id = p_product_id) then
          update public.product_images
          set storage_path = v_img_path,
              colour_code = v_img_colour,
              position = v_img_pos,
              alt_en = v_img_alt_en,
              alt_ar = v_img_alt_ar
          where id = v_img_id and product_id = p_product_id;
        else
          insert into public.product_images (product_id, storage_path, colour_code, position, alt_en, alt_ar)
          values (p_product_id, v_img_path, v_img_colour, v_img_pos, v_img_alt_en, v_img_alt_ar)
          on conflict (product_id, storage_path) do update set
            colour_code = excluded.colour_code,
            position = excluded.position,
            alt_en = excluded.alt_en,
            alt_ar = excluded.alt_ar;
        end if;
      end if;
    end loop;
  elsif nullif(trim(p_image_url), '') is not null then
    -- Fallback to single primary image URL
    if exists (select 1 from public.product_images where product_id = p_product_id and position = 10) then
      update public.product_images
      set
        storage_path = trim(p_image_url),
        alt_en = trim(p_title_en),
        alt_ar = trim(p_title_ar)
      where product_id = p_product_id and position = 10;
    else
      insert into public.product_images (product_id, storage_path, alt_en, alt_ar, position)
      values (p_product_id, trim(p_image_url), trim(p_title_en), trim(p_title_ar), 10)
      on conflict (product_id, storage_path) do update set
        alt_en = excluded.alt_en,
        alt_ar = excluded.alt_ar;
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

  -- Upsert colour option values
  v_position := 0;
  for v_colour in select value from jsonb_array_elements(p_colours) loop
    v_colour_code := lower(trim(v_colour->>'code'));
    v_position := v_position + 10;

    if v_colour_code !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      or char_length(trim(v_colour->>'en')) not between 1 and 60
      or char_length(trim(v_colour->>'ar')) not between 1 and 60
      or (v_colour->>'hex') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'Invalid colour data';
    end if;

    insert into public.product_option_values (
      option_id, code, label_en, label_ar, swatch_hex, position
    ) values (
      v_colour_option_id, v_colour_code, trim(v_colour->>'en'),
      trim(v_colour->>'ar'), v_colour->>'hex', v_position
    )
    on conflict (option_id, code) do update set
      label_en = excluded.label_en,
      label_ar = excluded.label_ar,
      swatch_hex = excluded.swatch_hex,
      position = excluded.position;
  end loop;

  -- Upsert size option values
  v_position := 0;
  foreach v_size in array p_sizes loop
    v_size := trim(v_size);
    v_position := v_position + 10;
    v_size_code := lower(regexp_replace(v_size, '[^a-zA-Z0-9]+', '-', 'g'));

    if char_length(v_size) not between 1 and 20 then
      raise exception 'Invalid size label';
    end if;

    insert into public.product_option_values (
      option_id, code, label_en, label_ar, position
    ) values (
      v_size_option_id, v_size_code, v_size, v_size, v_position
    )
    on conflict (option_id, code) do update set
      label_en = excluded.label_en,
      label_ar = excluded.label_ar,
      position = excluded.position;
  end loop;

  -- Synchronize product_variants for all colour x size combinations
  v_sku_prefix := upper(regexp_replace(p_slug, '[^a-zA-Z0-9]+', '-', 'g'));

  for v_colour in select value from jsonb_array_elements(p_colours) loop
    v_colour_code := lower(trim(v_colour->>'code'));

    select id into v_colour_value_id
    from public.product_option_values
    where option_id = v_colour_option_id and code = v_colour_code;

    foreach v_size in array p_sizes loop
      v_size := trim(v_size);
      v_size_code := lower(regexp_replace(v_size, '[^a-zA-Z0-9]+', '-', 'g'));

      select id into v_size_value_id
      from public.product_option_values
      where option_id = v_size_option_id and code = v_size_code;

      v_target_sku := v_sku_prefix || '-' || upper(v_colour_code) || '-' || upper(v_size_code);

      select id into v_variant_id
      from public.product_variants
      where product_id = p_product_id and sku = v_target_sku;

      if v_variant_id is null then
        insert into public.product_variants (product_id, sku, is_active)
        values (p_product_id, v_target_sku, true)
        returning id into v_variant_id;

        insert into public.product_variant_values (variant_id, option_value_id)
        values (v_variant_id, v_colour_value_id), (v_variant_id, v_size_value_id);

        insert into public.inventory (variant_id, on_hand, low_stock_threshold)
        values (v_variant_id, 0, 3)
        on conflict (variant_id) do nothing;
      else
        update public.product_variants
        set is_active = true
        where id = v_variant_id;
      end if;

      v_active_variant_ids := array_append(v_active_variant_ids, v_variant_id);
    end loop;
  end loop;

  -- Deactivate variants that are no longer in the colour/size matrix
  if cardinality(v_active_variant_ids) > 0 then
    update public.product_variants
    set is_active = false
    where product_id = p_product_id and id <> all(v_active_variant_ids);
  end if;

  return true;
end;
$$;

revoke all on function public.admin_update_product(bigint, text, text, text, text, text, bigint, text, public.product_status, bigint, bigint, bigint, bigint, text, text, jsonb, text[], text, jsonb) from public, anon;
grant execute on function public.admin_update_product(bigint, text, text, text, text, text, bigint, text, public.product_status, bigint, bigint, bigint, bigint, text, text, jsonb, text[], text, jsonb) to authenticated;

-- 3. Update admin_create_product_with_colours to support p_images
create or replace function public.admin_create_product_with_colours(
  p_slug text,
  p_title_en text,
  p_title_ar text,
  p_base_price_minor bigint,
  p_category_id bigint,
  p_gender text,
  p_sizes text[],
  p_stock integer,
  p_low_stock_threshold integer,
  p_status public.product_status,
  p_description_en text,
  p_description_ar text,
  p_compare_at_price_minor bigint,
  p_cost_minor bigint,
  p_material text,
  p_fit text,
  p_colours jsonb,
  p_image_url text default null,
  p_images jsonb default null
)
returns bigint
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_product_id bigint;
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

  -- Multi-images handling variables
  v_img jsonb;
  v_img_path text;
  v_img_colour text;
  v_img_pos integer;
  v_img_alt_en text;
  v_img_alt_ar text;
begin
  if not (select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or char_length(trim(p_title_en)) not between 2 and 140
    or char_length(trim(p_title_ar)) not between 2 and 140
    or p_base_price_minor < 0
    or (p_compare_at_price_minor is not null and p_compare_at_price_minor < p_base_price_minor)
    or (p_cost_minor is not null and p_cost_minor < 0)
    or p_stock < 0
    or p_low_stock_threshold < 0
    or cardinality(p_sizes) not between 1 and 20
    or jsonb_typeof(p_colours) <> 'array'
    or jsonb_array_length(p_colours) not between 1 and 12
    or p_gender not in ('men', 'women', 'boys', 'girls', 'unisex') then
    raise exception 'Invalid product data';
  end if;

  if not exists (select 1 from public.categories where id = p_category_id) then
    raise exception 'Category not found';
  end if;

  if (
    select count(distinct lower(trim(value->>'code'))) <> count(*)
    from jsonb_array_elements(p_colours)
  ) then
    raise exception 'Colour codes must be unique';
  end if;

  insert into public.products (
    category_id, slug, status, brand, material, gender, fit,
    base_price_minor, compare_at_price_minor, cost_minor, published_at,
    created_by, updated_by
  ) values (
    p_category_id, p_slug, p_status, 'Scrub Vibe', nullif(trim(p_material), ''),
    p_gender, nullif(trim(p_fit), ''), p_base_price_minor,
    p_compare_at_price_minor, p_cost_minor,
    case when p_status = 'active' then now() else null end,
    auth.uid(), auth.uid()
  ) returning id into v_product_id;

  insert into public.product_translations (
    product_id, locale, title, description, seo_title, seo_description
  ) values
    (
      v_product_id, 'en', trim(p_title_en), nullif(trim(p_description_en), ''),
      trim(p_title_en) || ' | Scrub Vibe Egypt', nullif(trim(p_description_en), '')
    ),
    (
      v_product_id, 'ar', trim(p_title_ar), nullif(trim(p_description_ar), ''),
      trim(p_title_ar) || ' | سكراب فايب مصر', nullif(trim(p_description_ar), '')
    );

  -- Multi-images or single image handling
  if p_images is not null and jsonb_typeof(p_images) = 'array' and jsonb_array_length(p_images) > 0 then
    for v_img in select value from jsonb_array_elements(p_images) loop
      v_img_path := trim(coalesce(v_img->>'storage_path', v_img->>'src', ''));
      v_img_colour := nullif(trim(coalesce(v_img->>'colour_code', v_img->>'colourCode', '')), '');
      v_img_pos := coalesce((v_img->>'position')::integer, 10);
      v_img_alt_en := coalesce(nullif(trim(v_img->>'alt_en'), ''), trim(p_title_en));
      v_img_alt_ar := coalesce(nullif(trim(v_img->>'alt_ar'), ''), trim(p_title_ar));

      if v_img_path <> '' then
        insert into public.product_images (product_id, storage_path, colour_code, position, alt_en, alt_ar)
        values (v_product_id, v_img_path, v_img_colour, v_img_pos, v_img_alt_en, v_img_alt_ar)
        on conflict (product_id, storage_path) do update set
          colour_code = excluded.colour_code,
          position = excluded.position,
          alt_en = excluded.alt_en,
          alt_ar = excluded.alt_ar;
      end if;
    end loop;
  elsif nullif(trim(p_image_url), '') is not null then
    insert into public.product_images (product_id, storage_path, alt_en, alt_ar, position)
    values (v_product_id, trim(p_image_url), trim(p_title_en), trim(p_title_ar), 10);
  end if;

  insert into public.product_options (product_id, code, name_en, name_ar, position)
  values (v_product_id, 'color', 'Colour', 'اللون', 10)
  returning id into v_colour_option_id;

  insert into public.product_options (product_id, code, name_en, name_ar, position)
  values (v_product_id, 'size', 'Size', 'المقاس', 20)
  returning id into v_size_option_id;

  for v_colour in select value from jsonb_array_elements(p_colours) loop
    v_colour_code := lower(trim(v_colour->>'code'));
    v_position := v_position + 10;
    if v_colour_code !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      or char_length(trim(v_colour->>'en')) not between 1 and 60
      or char_length(trim(v_colour->>'ar')) not between 1 and 60
      or (v_colour->>'hex') !~ '^#[0-9A-Fa-f]{6}$' then
      raise exception 'Invalid colour data';
    end if;

    insert into public.product_option_values (
      option_id, code, label_en, label_ar, swatch_hex, position
    ) values (
      v_colour_option_id, v_colour_code, trim(v_colour->>'en'),
      trim(v_colour->>'ar'), v_colour->>'hex', v_position
    );
  end loop;

  foreach v_size in array p_sizes loop
    v_size := trim(v_size);
    v_position := v_position + 10;
    v_size_code := lower(regexp_replace(v_size, '[^a-zA-Z0-9]+', '-', 'g'));

    if char_length(v_size) not between 1 and 20 then
      raise exception 'Invalid size label';
    end if;

    insert into public.product_option_values (
      option_id, code, label_en, label_ar, position
    ) values (
      v_size_option_id, v_size_code, v_size, v_size, v_position
    );
  end loop;

  v_sku_prefix := upper(regexp_replace(p_slug, '[^a-zA-Z0-9]+', '-', 'g'));

  for v_colour in select value from jsonb_array_elements(p_colours) loop
    v_colour_code := lower(trim(v_colour->>'code'));

    select id into v_colour_value_id
    from public.product_option_values
    where option_id = v_colour_option_id and code = v_colour_code;

    foreach v_size in array p_sizes loop
      v_size := trim(v_size);
      v_size_code := lower(regexp_replace(v_size, '[^a-zA-Z0-9]+', '-', 'g'));

      select id into v_size_value_id
      from public.product_option_values
      where option_id = v_size_option_id and code = v_size_code;

      insert into public.product_variants (product_id, sku, is_active)
      values (
        v_product_id,
        v_sku_prefix || '-' || upper(v_colour_code) || '-' || upper(v_size_code),
        true
      )
      returning id into v_variant_id;

      insert into public.product_variant_values (variant_id, option_value_id)
      values (v_variant_id, v_colour_value_id), (v_variant_id, v_size_value_id);

      insert into public.inventory (variant_id, on_hand, low_stock_threshold)
      values (v_variant_id, p_stock, p_low_stock_threshold);

      if p_stock > 0 then
        insert into public.inventory_movements (
          variant_id, movement_type, quantity_delta, reason, actor_id
        ) values (
          v_variant_id, 'receipt', p_stock, 'Opening stock', auth.uid()
        );
      end if;
    end loop;
  end loop;

  return v_product_id;
end;
$$;

revoke all on function public.admin_create_product_with_colours(text, text, text, bigint, bigint, text, text[], integer, integer, public.product_status, text, text, bigint, bigint, text, text, jsonb, text, jsonb) from public, anon;
grant execute on function public.admin_create_product_with_colours(text, text, text, bigint, bigint, text, text[], integer, integer, public.product_status, text, text, bigint, bigint, text, text, jsonb, text, jsonb) to authenticated;
