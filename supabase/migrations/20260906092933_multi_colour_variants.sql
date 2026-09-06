-- Add full colour x size variant support and import the palette observed in the
-- original Scrub Vibe catalogue. The existing normalized option tables already
-- model this cleanly, so no additional public table is required.

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
  p_image_url text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
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

  if nullif(trim(p_image_url), '') is not null then
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
    if v_size = '' or char_length(v_size) > 20 then
      raise exception 'Invalid product size';
    end if;
    v_size_code := lower(regexp_replace(v_size, '[^a-zA-Z0-9]+', '-', 'g'));
    insert into public.product_option_values (
      option_id, code, label_en, label_ar, position
    ) values (
      v_size_option_id, v_size_code, v_size, v_size,
      array_position(p_sizes, v_size) * 10
    );
  end loop;

  v_sku_prefix := upper(regexp_replace(p_slug, '[^a-zA-Z0-9]+', '-', 'g'));
  for v_colour_value_id, v_colour_code in
    select id, code from public.product_option_values
    where option_id = v_colour_option_id order by position
  loop
    for v_size_value_id, v_size_code in
      select id, code from public.product_option_values
      where option_id = v_size_option_id order by position
    loop
      insert into public.product_variants (product_id, sku, is_active)
      values (
        v_product_id,
        'SV-' || v_sku_prefix || '-' || upper(v_colour_code) || '-' || upper(v_size_code),
        true
      ) returning id into v_variant_id;

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

revoke execute on function public.admin_create_product_with_colours(text, text, text, bigint, bigint, text, text[], integer, integer, public.product_status, text, text, bigint, bigint, text, text, jsonb, text) from public, anon;
grant execute on function public.admin_create_product_with_colours(text, text, text, bigint, bigint, text, text[], integer, integer, public.product_status, text, text, bigint, bigint, text, text, jsonb, text) to authenticated;

do $$
declare
  v_product record;
  v_colour jsonb;
  v_colour_value_id bigint;
  v_size record;
  v_variant_id bigint;
  v_stock integer;
  v_threshold integer;
  v_palette jsonb := '[
    {"code":"burgundy","en":"Burgundy","ar":"نبيتي","hex":"#6f182f"},
    {"code":"black","en":"Black","ar":"أسود","hex":"#171717"},
    {"code":"stone","en":"Stone","ar":"حجري","hex":"#a89e91"},
    {"code":"charcoal","en":"Charcoal","ar":"فحمي","hex":"#34363d"},
    {"code":"sky-blue","en":"Sky blue","ar":"سماوي","hex":"#a8cce7"},
    {"code":"navy","en":"Navy","ar":"كحلي","hex":"#172c52"},
    {"code":"olive","en":"Olive","ar":"زيتوني","hex":"#4f5041"},
    {"code":"teal","en":"Teal","ar":"بترولي","hex":"#07516a"}
  ]'::jsonb;
begin
  for v_product in
    select p.id, p.slug, colour_option.id as colour_option_id,
      size_option.id as size_option_id
    from public.products p
    join public.product_options colour_option
      on colour_option.product_id = p.id and colour_option.code = 'color'
    join public.product_options size_option
      on size_option.product_id = p.id and size_option.code = 'size'
    where p.brand = 'Scrub Vibe' and p.slug like '%scrub-set'
  loop
    for v_colour in
      select value from jsonb_array_elements(v_palette)
    loop
      insert into public.product_option_values (
        option_id, code, label_en, label_ar, swatch_hex, position
      ) values (
        v_product.colour_option_id,
        v_colour->>'code',
        v_colour->>'en',
        v_colour->>'ar',
        v_colour->>'hex',
        (
          select (ordinality * 10)::integer
          from jsonb_array_elements(v_palette) with ordinality palette(value, ordinality)
          where palette.value->>'code' = v_colour->>'code'
        )
      )
      on conflict (option_id, code) do update set
        label_en = excluded.label_en,
        label_ar = excluded.label_ar,
        swatch_hex = excluded.swatch_hex,
        position = excluded.position
      returning id into v_colour_value_id;

      for v_size in
        select id, code from public.product_option_values
        where option_id = v_product.size_option_id
        order by position
      loop
        if not exists (
          select 1
          from public.product_variants pv
          where pv.product_id = v_product.id
            and exists (
              select 1 from public.product_variant_values pvv
              where pvv.variant_id = pv.id and pvv.option_value_id = v_colour_value_id
            )
            and exists (
              select 1 from public.product_variant_values pvv
              where pvv.variant_id = pv.id and pvv.option_value_id = v_size.id
            )
        ) then
          select coalesce(max(i.on_hand), 10), coalesce(max(i.low_stock_threshold), 3)
          into v_stock, v_threshold
          from public.product_variants pv
          join public.product_variant_values pvv on pvv.variant_id = pv.id
          join public.inventory i on i.variant_id = pv.id
          where pv.product_id = v_product.id and pvv.option_value_id = v_size.id;

          insert into public.product_variants (product_id, sku, is_active)
          values (
            v_product.id,
            'SV-' || upper(regexp_replace(v_product.slug, '[^a-zA-Z0-9]+', '-', 'g')) ||
              '-' || upper(v_colour->>'code') || '-' || upper(v_size.code),
            true
          ) returning id into v_variant_id;

          insert into public.product_variant_values (variant_id, option_value_id)
          values (v_variant_id, v_colour_value_id), (v_variant_id, v_size.id);

          insert into public.inventory (variant_id, on_hand, low_stock_threshold)
          values (v_variant_id, v_stock, v_threshold);

          if v_stock > 0 then
            insert into public.inventory_movements (
              variant_id, movement_type, quantity_delta, reason
            ) values (
              v_variant_id, 'receipt', v_stock, 'Imported Scrub Vibe colour palette'
            );
          end if;
        end if;
      end loop;
    end loop;
  end loop;
end;
$$;
