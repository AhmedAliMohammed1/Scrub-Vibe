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
  update public.products
  set status = 'archived', updated_at = now()
  where slug in (
    'linen-ease-shirt',
    'soft-structure-vest',
    'wide-leg-trouser',
    'everyday-overshirt'
  );

  insert into public.categories (slug, position, is_active)
  values
    ('female-scrubs', 10, true),
    ('male-scrubs', 20, true),
    ('lab-coats', 30, true)
  on conflict (slug) do update
  set position = excluded.position, is_active = excluded.is_active;

  insert into public.category_translations (category_id, locale, name)
  select
    id,
    'en',
    case slug
      when 'female-scrubs' then 'Female scrubs'
      when 'male-scrubs' then 'Male scrubs'
      else 'Lab coats'
    end
  from public.categories
  where slug in ('female-scrubs', 'male-scrubs', 'lab-coats')
  on conflict (category_id, locale) do update set name = excluded.name;

  insert into public.category_translations (category_id, locale, name)
  select
    id,
    'ar',
    case slug
      when 'female-scrubs' then 'سكراب حريمي'
      when 'male-scrubs' then 'سكراب رجالي'
      else 'بالطو طبي'
    end
  from public.categories
  where slug in ('female-scrubs', 'male-scrubs', 'lab-coats')
  on conflict (category_id, locale) do update set name = excluded.name;

  for catalogue_product in
    select value from jsonb_array_elements(
      '[
        {
          "slug": "female-design-2-scrub-set",
          "category": "female-scrubs",
          "gender": "women",
          "title_en": "Women''s Design 2 Scrub Set",
          "title_ar": "طقم سكراب حريمي تصميم ٢",
          "description_en": "A polished burgundy scrub set with practical pockets, premium fabric and an easy fit made for long shifts.",
          "description_ar": "طقم سكراب بلون نبيتي بقماش عالي الجودة وجيوب عملية وقصة مريحة لساعات العمل الطويلة.",
          "price": 85000,
          "compare_at": 100000,
          "color_code": "burgundy",
          "color_en": "Burgundy",
          "color_ar": "نبيتي",
          "swatch": "#6f182f",
          "sizes": ["XS", "S", "M", "L", "XL", "2XL"],
          "image": "/images/scrub-vibe/female-design-2.webp"
        },
        {
          "slug": "female-design-9-scrub-set",
          "category": "female-scrubs",
          "gender": "women",
          "title_en": "Women''s Design 9 Scrub Set",
          "title_ar": "طقم سكراب حريمي تصميم ٩",
          "description_en": "A clean black scrub set designed for effortless movement, dependable coverage and all-day comfort.",
          "description_ar": "طقم سكراب أسود بقصة عملية تمنح حرية حركة وراحة طوال اليوم.",
          "price": 85000,
          "compare_at": 99900,
          "color_code": "black",
          "color_en": "Black",
          "color_ar": "أسود",
          "swatch": "#171717",
          "sizes": ["XS", "S", "M", "L", "XL", "2XL"],
          "image": "/images/scrub-vibe/female-design-9.webp"
        },
        {
          "slug": "female-design-4-scrub-set",
          "category": "female-scrubs",
          "gender": "women",
          "title_en": "Women''s Design 4 Scrub Set",
          "title_ar": "طقم سكراب حريمي تصميم ٤",
          "description_en": "A stone scrub set with a modern straight silhouette, practical pockets and a soft professional finish.",
          "description_ar": "طقم سكراب بلون حجري وقصة مستقيمة عصرية مع جيوب عملية ولمسة احترافية ناعمة.",
          "price": 85000,
          "compare_at": 100000,
          "color_code": "stone",
          "color_en": "Stone",
          "color_ar": "حجري",
          "swatch": "#a89e91",
          "sizes": ["XS", "S", "M", "L", "XL", "2XL"],
          "image": "/images/scrub-vibe/female-design-4.webp"
        },
        {
          "slug": "female-design-7-scrub-set",
          "category": "female-scrubs",
          "gender": "women",
          "title_en": "Women''s Design 7 Scrub Set",
          "title_ar": "طقم سكراب حريمي تصميم ٧",
          "description_en": "A modest charcoal scrub set with long sleeves, a relaxed fit and roomy pockets for busy days.",
          "description_ar": "طقم سكراب محتشم باللون الفحمي بأكمام طويلة وقصة مريحة وجيوب واسعة لأيام العمل المزدحمة.",
          "price": 85000,
          "compare_at": 100000,
          "color_code": "charcoal",
          "color_en": "Charcoal",
          "color_ar": "فحمي",
          "swatch": "#34363d",
          "sizes": ["XS", "S", "M", "L", "XL", "2XL"],
          "image": "/images/scrub-vibe/female-design-7.webp"
        },
        {
          "slug": "female-design-6-scrub-set",
          "category": "female-scrubs",
          "gender": "women",
          "title_en": "Women''s Design 6 Scrub Set",
          "title_ar": "طقم سكراب حريمي تصميم ٦",
          "description_en": "A sky-blue long-sleeve scrub set with adjustable side ties and a feminine, shift-ready silhouette.",
          "description_ar": "طقم سكراب سماوي بأكمام طويلة ورباط جانبي قابل للتعديل وقصة أنيقة مناسبة للعمل.",
          "price": 85000,
          "compare_at": 100000,
          "color_code": "sky-blue",
          "color_en": "Sky blue",
          "color_ar": "سماوي",
          "swatch": "#a8cce7",
          "sizes": ["XS", "S", "M", "L", "XL", "2XL"],
          "image": "/images/scrub-vibe/female-design-6.webp"
        },
        {
          "slug": "male-design-1-scrub-set",
          "category": "male-scrubs",
          "gender": "men",
          "title_en": "Men''s Design 1 Scrub Set",
          "title_ar": "طقم سكراب رجالي تصميم ١",
          "description_en": "A navy V-neck scrub set with a streamlined fit and practical pocket placement for everyday clinical work.",
          "description_ar": "طقم سكراب رجالي كحلي بياقة على شكل حرف V وقصة انسيابية وجيوب عملية للعمل اليومي.",
          "price": 85000,
          "compare_at": 100000,
          "color_code": "navy",
          "color_en": "Navy",
          "color_ar": "كحلي",
          "swatch": "#172c52",
          "sizes": ["S", "M", "L", "XL", "2XL", "3XL"],
          "image": "/images/scrub-vibe/male-design-1.jpg"
        },
        {
          "slug": "male-design-2-scrub-set",
          "category": "male-scrubs",
          "gender": "men",
          "title_en": "Men''s Design 2 Scrub Set",
          "title_ar": "طقم سكراب رجالي تصميم ٢",
          "description_en": "An olive zip-neck scrub set balancing a refined look with easy movement and useful storage.",
          "description_ar": "طقم سكراب رجالي زيتوني بياقة وسحّاب يجمع بين المظهر الأنيق وحرية الحركة والجيوب العملية.",
          "price": 85000,
          "compare_at": 100000,
          "color_code": "olive",
          "color_en": "Olive",
          "color_ar": "زيتوني",
          "swatch": "#4f5041",
          "sizes": ["S", "M", "L", "XL", "2XL", "3XL"],
          "image": "/images/scrub-vibe/male-design-2.webp"
        },
        {
          "slug": "male-design-5-scrub-set",
          "category": "male-scrubs",
          "gender": "men",
          "title_en": "Men''s Design 5 Scrub Set",
          "title_ar": "طقم سكراب رجالي تصميم ٥",
          "description_en": "A rich teal scrub set made for a confident professional look, reliable comfort and repeated wear.",
          "description_ar": "طقم سكراب رجالي باللون البترولي لمظهر مهني مميز وراحة موثوقة مع الاستخدام المتكرر.",
          "price": 85000,
          "compare_at": 100000,
          "color_code": "teal",
          "color_en": "Teal",
          "color_ar": "بترولي",
          "swatch": "#07516a",
          "sizes": ["S", "M", "L", "XL", "2XL", "3XL"],
          "image": "/images/scrub-vibe/male-design-5.jpeg"
        },
        {
          "slug": "classic-medical-lab-coat",
          "category": "lab-coats",
          "gender": "unisex",
          "title_en": "Classic Medical Lab Coat",
          "title_ar": "بالطو طبي كلاسيك",
          "description_en": "A crisp white medical coat with a classic collar, roomy pockets and dependable coverage for clinic and laboratory use.",
          "description_ar": "بالطو طبي أبيض بياقة كلاسيكية وجيوب واسعة وتغطية مناسبة للاستخدام في العيادة والمعمل.",
          "price": 55000,
          "compare_at": null,
          "color_code": "white",
          "color_en": "White",
          "color_ar": "أبيض",
          "swatch": "#f4f4f2",
          "sizes": ["S", "M", "L", "XL", "2XL"],
          "image": "/images/scrub-vibe/lab-coat.webp"
        }
      ]'::jsonb
    )
  loop
    select id into v_category_id
    from public.categories
    where slug = catalogue_product ->> 'category';

    insert into public.products (
      category_id,
      slug,
      status,
      brand,
      gender,
      base_price_minor,
      compare_at_price_minor,
      published_at
    ) values (
      v_category_id,
      catalogue_product ->> 'slug',
      'active',
      'Scrub Vibe',
      catalogue_product ->> 'gender',
      (catalogue_product ->> 'price')::bigint,
      (catalogue_product ->> 'compare_at')::bigint,
      '2026-09-05 00:00:00+00'
    )
    on conflict (slug) do update set
      category_id = excluded.category_id,
      status = excluded.status,
      brand = excluded.brand,
      gender = excluded.gender,
      base_price_minor = excluded.base_price_minor,
      compare_at_price_minor = excluded.compare_at_price_minor,
      published_at = excluded.published_at,
      updated_at = now()
    returning id into v_product_id;

    insert into public.product_translations (
      product_id,
      locale,
      title,
      description,
      care_instructions,
      seo_title,
      seo_description
    ) values
      (
        v_product_id,
        'en',
        catalogue_product ->> 'title_en',
        catalogue_product ->> 'description_en',
        'Machine wash cold with similar colours. Do not bleach. Hang dry and iron on low heat.',
        (catalogue_product ->> 'title_en') || ' | Scrub Vibe Egypt',
        catalogue_product ->> 'description_en'
      ),
      (
        v_product_id,
        'ar',
        catalogue_product ->> 'title_ar',
        catalogue_product ->> 'description_ar',
        'غسيل آلي بماء بارد مع ألوان مشابهة. لا تستخدم المبيض. يعلق ليجف ويكوى بحرارة منخفضة.',
        (catalogue_product ->> 'title_ar') || ' | سكراب فايب مصر',
        catalogue_product ->> 'description_ar'
      )
    on conflict (product_id, locale) do update set
      title = excluded.title,
      description = excluded.description,
      care_instructions = excluded.care_instructions,
      seo_title = excluded.seo_title,
      seo_description = excluded.seo_description;

    insert into public.product_images (
      product_id,
      storage_path,
      alt_en,
      alt_ar,
      position
    ) values (
      v_product_id,
      catalogue_product ->> 'image',
      catalogue_product ->> 'title_en',
      catalogue_product ->> 'title_ar',
      10
    )
    on conflict (product_id, storage_path) do update set
      alt_en = excluded.alt_en,
      alt_ar = excluded.alt_ar,
      position = excluded.position;

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
        upper('SCRUB-VIBE-' || (catalogue_product ->> 'slug') || '-' || size_record.code),
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
      ) values (v_variant_id, 12, 0, 3)
      on conflict (variant_id) do update set
        on_hand = excluded.on_hand,
        low_stock_threshold = excluded.low_stock_threshold,
        updated_at = now();
    end loop;
  end loop;
end;
$$;
