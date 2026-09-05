do $$
declare
  catalogue_product jsonb;
  v_product_id bigint;
  v_category_id bigint;
  v_color_option_id bigint;
  v_size_option_id bigint;
  v_color_value_id bigint;
  v_size_value_id bigint;
  v_variant_id bigint;
  size_record record;
begin
  insert into public.categories (slug, position, is_active)
  values ('women', 10, true), ('men', 20, true)
  on conflict (slug) do update
  set position = excluded.position, is_active = excluded.is_active;

  insert into public.category_translations (category_id, locale, name)
  select id, 'en', initcap(slug) from public.categories where slug in ('women', 'men')
  on conflict (category_id, locale) do update set name = excluded.name;

  insert into public.category_translations (category_id, locale, name)
  select id, 'ar', case slug when 'women' then 'نساء' else 'رجال' end
  from public.categories where slug in ('women', 'men')
  on conflict (category_id, locale) do update set name = excluded.name;

  for catalogue_product in
    select value from jsonb_array_elements(
      '[
        {
          "slug": "linen-ease-shirt",
          "title_en": "Linen Ease Shirt",
          "title_ar": "قميص كتان مريح",
          "gender": "men",
          "price": 129900,
          "compare_at": null,
          "color_code": "oat",
          "color_en": "Oat",
          "color_ar": "شوفان",
          "swatch": "#c8b298",
          "sizes": ["S", "M", "L", "XL"],
          "stock": 12,
          "low_stock_threshold": 3
        },
        {
          "slug": "soft-structure-vest",
          "title_en": "Soft Structure Vest",
          "title_ar": "صديري بقصّة ناعمة",
          "gender": "women",
          "price": 109900,
          "compare_at": 139900,
          "color_code": "bone",
          "color_en": "Bone",
          "color_ar": "عاجي",
          "swatch": "#ede5d5",
          "sizes": ["XS", "S", "M", "L"],
          "stock": 9,
          "low_stock_threshold": 3
        },
        {
          "slug": "wide-leg-trouser",
          "title_en": "Fluid Wide-Leg Trouser",
          "title_ar": "بنطلون واسع انسيابي",
          "gender": "women",
          "price": 149900,
          "compare_at": null,
          "color_code": "olive",
          "color_en": "Olive",
          "color_ar": "زيتوني",
          "swatch": "#3e4532",
          "sizes": ["S", "M", "L"],
          "stock": 8,
          "low_stock_threshold": 3
        },
        {
          "slug": "everyday-overshirt",
          "title_en": "Everyday Overshirt",
          "title_ar": "أوفرشيرت يومي",
          "gender": "men",
          "price": 159900,
          "compare_at": null,
          "color_code": "ink",
          "color_en": "Ink",
          "color_ar": "حبري",
          "swatch": "#282725",
          "sizes": ["M", "L", "XL", "2XL"],
          "stock": 2,
          "low_stock_threshold": 3
        }
      ]'::jsonb
    )
  loop
    select id into v_category_id
    from public.categories
    where slug = catalogue_product ->> 'gender';

    insert into public.products (
      category_id,
      slug,
      status,
      gender,
      base_price_minor,
      compare_at_price_minor,
      published_at
    ) values (
      v_category_id,
      catalogue_product ->> 'slug',
      'active',
      catalogue_product ->> 'gender',
      (catalogue_product ->> 'price')::bigint,
      (catalogue_product ->> 'compare_at')::bigint,
      '2026-08-29 00:00:00+00'
    )
    on conflict (slug) do update set
      category_id = excluded.category_id,
      status = excluded.status,
      gender = excluded.gender,
      base_price_minor = excluded.base_price_minor,
      compare_at_price_minor = excluded.compare_at_price_minor,
      published_at = excluded.published_at,
      updated_at = now()
    returning id into v_product_id;

    insert into public.product_translations (product_id, locale, title)
    values
      (v_product_id, 'en', catalogue_product ->> 'title_en'),
      (v_product_id, 'ar', catalogue_product ->> 'title_ar')
    on conflict (product_id, locale) do update set title = excluded.title;

    insert into public.product_options (product_id, code, name_en, name_ar, position)
    values (v_product_id, 'color', 'Color', 'اللون', 10)
    on conflict (product_id, code) do update set
      name_en = excluded.name_en,
      name_ar = excluded.name_ar,
      position = excluded.position
    returning id into v_color_option_id;

    insert into public.product_options (product_id, code, name_en, name_ar, position)
    values (v_product_id, 'size', 'Size', 'المقاس', 20)
    on conflict (product_id, code) do update set
      name_en = excluded.name_en,
      name_ar = excluded.name_ar,
      position = excluded.position
    returning id into v_size_option_id;

    insert into public.product_option_values (
      option_id,
      code,
      label_en,
      label_ar,
      swatch_hex,
      position
    ) values (
      v_color_option_id,
      catalogue_product ->> 'color_code',
      catalogue_product ->> 'color_en',
      catalogue_product ->> 'color_ar',
      catalogue_product ->> 'swatch',
      10
    )
    on conflict (option_id, code) do update set
      label_en = excluded.label_en,
      label_ar = excluded.label_ar,
      swatch_hex = excluded.swatch_hex,
      position = excluded.position
    returning id into v_color_value_id;

    for size_record in
      select value #>> '{}' as code, ordinality::integer as position
      from jsonb_array_elements(catalogue_product -> 'sizes') with ordinality
    loop
      insert into public.product_option_values (
        option_id,
        code,
        label_en,
        label_ar,
        position
      ) values (
        v_size_option_id,
        lower(size_record.code),
        size_record.code,
        size_record.code,
        size_record.position * 10
      )
      on conflict (option_id, code) do update set
        label_en = excluded.label_en,
        label_ar = excluded.label_ar,
        position = excluded.position
      returning id into v_size_value_id;

      insert into public.product_variants (product_id, sku, is_active)
      values (
        v_product_id,
        upper(
          'NOVA-' || (catalogue_product ->> 'slug') || '-' || size_record.code
        ),
        true
      )
      on conflict (sku) do update set is_active = excluded.is_active, updated_at = now()
      returning id into v_variant_id;

      insert into public.product_variant_values (variant_id, option_value_id)
      values
        (v_variant_id, v_color_value_id),
        (v_variant_id, v_size_value_id)
      on conflict do nothing;

      insert into public.inventory (
        variant_id,
        on_hand,
        reserved,
        low_stock_threshold
      ) values (
        v_variant_id,
        (catalogue_product ->> 'stock')::integer,
        0,
        (catalogue_product ->> 'low_stock_threshold')::integer
      )
      on conflict (variant_id) do update set
        on_hand = excluded.on_hand,
        reserved = excluded.reserved,
        low_stock_threshold = excluded.low_stock_threshold,
        updated_at = now();
    end loop;
  end loop;
end;
$$;
