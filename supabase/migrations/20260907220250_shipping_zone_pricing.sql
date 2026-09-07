create table public.shipping_zones (
  id bigint generated always as identity primary key,
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name_en text not null check (char_length(name_en) between 2 and 80),
  name_ar text not null check (char_length(name_ar) between 2 and 80),
  shipping_fee_minor bigint not null check (shipping_fee_minor >= 0),
  free_shipping_threshold_minor bigint check (
    free_shipping_threshold_minor is null or free_shipping_threshold_minor > 0
  ),
  cod_enabled boolean not null default true,
  cod_surcharge_minor bigint not null default 0 check (cod_surcharge_minor >= 0),
  delivery_min_days smallint not null check (delivery_min_days between 1 and 30),
  delivery_max_days smallint not null check (
    delivery_max_days between delivery_min_days and 45
  ),
  is_active boolean not null default true,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_governorates (
  code text primary key check (code ~ '^[a-z0-9_]+$'),
  name_en text not null unique check (char_length(name_en) between 2 and 80),
  name_ar text not null unique check (char_length(name_ar) between 2 and 80),
  zone_id bigint not null references public.shipping_zones(id) on delete restrict,
  is_active boolean not null default true,
  position smallint not null default 0
);
create index shipping_governorates_zone_idx on public.shipping_governorates (zone_id);

create table public.shipping_cities (
  id bigint generated always as identity primary key,
  governorate_code text not null references public.shipping_governorates(code) on delete restrict,
  code text not null check (code ~ '^[a-z0-9_]+$'),
  name_en text not null check (char_length(name_en) between 2 and 100),
  name_ar text not null check (char_length(name_ar) between 2 and 100),
  is_active boolean not null default true,
  position smallint not null default 0,
  unique (governorate_code, code)
);
create index shipping_cities_governorate_idx
  on public.shipping_cities (governorate_code, position);

alter table public.shipping_zones enable row level security;
alter table public.shipping_governorates enable row level security;
alter table public.shipping_cities enable row level security;

revoke all on public.shipping_zones, public.shipping_governorates, public.shipping_cities
  from anon, authenticated;
grant select on public.shipping_zones, public.shipping_governorates, public.shipping_cities
  to anon, authenticated;
grant update on public.shipping_zones to authenticated;

create policy shipping_zones_anon_select
on public.shipping_zones for select to anon using (is_active);
create policy shipping_zones_authenticated_select
on public.shipping_zones for select to authenticated
using (is_active or (select private.has_any_role(array['admin','super_admin']::public.app_role[])));
create policy shipping_zones_admin_update
on public.shipping_zones for update to authenticated
using ((select private.has_any_role(array['admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['admin','super_admin']::public.app_role[])));

create policy shipping_governorates_anon_select
on public.shipping_governorates for select to anon
using (
  is_active and exists (
    select 1 from public.shipping_zones z where z.id = zone_id and z.is_active
  )
);
create policy shipping_governorates_authenticated_select
on public.shipping_governorates for select to authenticated
using (
  (is_active and exists (
    select 1 from public.shipping_zones z where z.id = zone_id and z.is_active
  )) or (select private.has_any_role(array['admin','super_admin']::public.app_role[]))
);

create policy shipping_cities_anon_select
on public.shipping_cities for select to anon
using (
  is_active and exists (
    select 1
    from public.shipping_governorates g
    join public.shipping_zones z on z.id = g.zone_id
    where g.code = governorate_code and g.is_active and z.is_active
  )
);
create policy shipping_cities_authenticated_select
on public.shipping_cities for select to authenticated
using (
  (is_active and exists (
    select 1
    from public.shipping_governorates g
    join public.shipping_zones z on z.id = g.zone_id
    where g.code = governorate_code and g.is_active and z.is_active
  )) or (select private.has_any_role(array['admin','super_admin']::public.app_role[]))
);

insert into public.shipping_zones (
  code, name_en, name_ar, shipping_fee_minor, free_shipping_threshold_minor,
  cod_enabled, cod_surcharge_minor, delivery_min_days, delivery_max_days, position
) values
  ('greater_cairo', 'Greater Cairo', 'القاهرة الكبرى', 6000, 250000, true, 0, 1, 3, 10),
  ('greater_giza', 'Greater Giza', 'الجيزة الكبرى', 6500, 250000, true, 0, 1, 3, 20),
  ('alexandria', 'Alexandria', 'الإسكندرية', 7500, 250000, true, 0, 2, 4, 30),
  ('delta_canal', 'Delta and Canal', 'الدلتا ومدن القناة', 8000, 250000, true, 0, 2, 5, 40),
  ('upper_egypt', 'Upper Egypt', 'صعيد مصر', 9500, 250000, true, 0, 3, 6, 50),
  ('remote', 'Remote governorates', 'المحافظات البعيدة', 12000, 250000, true, 0, 4, 8, 60);

insert into public.shipping_governorates (code, name_en, name_ar, zone_id, position)
select v.code, v.name_en, v.name_ar, z.id, v.position
from (values
  ('cairo', 'Cairo', 'القاهرة', 'greater_cairo', 10),
  ('giza', 'Giza', 'الجيزة', 'greater_giza', 20),
  ('alexandria', 'Alexandria', 'الإسكندرية', 'alexandria', 30),
  ('dakahlia', 'Dakahlia', 'الدقهلية', 'delta_canal', 40),
  ('red_sea', 'Red Sea', 'البحر الأحمر', 'remote', 50),
  ('beheira', 'Beheira', 'البحيرة', 'delta_canal', 60),
  ('fayoum', 'Fayoum', 'الفيوم', 'upper_egypt', 70),
  ('gharbia', 'Gharbia', 'الغربية', 'delta_canal', 80),
  ('ismailia', 'Ismailia', 'الإسماعيلية', 'delta_canal', 90),
  ('monufia', 'Monufia', 'المنوفية', 'delta_canal', 100),
  ('minya', 'Minya', 'المنيا', 'upper_egypt', 110),
  ('qalyubia', 'Qalyubia', 'القليوبية', 'delta_canal', 120),
  ('new_valley', 'New Valley', 'الوادي الجديد', 'remote', 130),
  ('suez', 'Suez', 'السويس', 'delta_canal', 140),
  ('aswan', 'Aswan', 'أسوان', 'upper_egypt', 150),
  ('assiut', 'Assiut', 'أسيوط', 'upper_egypt', 160),
  ('beni_suef', 'Beni Suef', 'بني سويف', 'upper_egypt', 170),
  ('port_said', 'Port Said', 'بورسعيد', 'delta_canal', 180),
  ('damietta', 'Damietta', 'دمياط', 'delta_canal', 190),
  ('sharqia', 'Sharqia', 'الشرقية', 'delta_canal', 200),
  ('south_sinai', 'South Sinai', 'جنوب سيناء', 'remote', 210),
  ('kafr_el_sheikh', 'Kafr El Sheikh', 'كفر الشيخ', 'delta_canal', 220),
  ('matrouh', 'Matrouh', 'مطروح', 'remote', 230),
  ('luxor', 'Luxor', 'الأقصر', 'upper_egypt', 240),
  ('qena', 'Qena', 'قنا', 'upper_egypt', 250),
  ('north_sinai', 'North Sinai', 'شمال سيناء', 'remote', 260),
  ('sohag', 'Sohag', 'سوهاج', 'upper_egypt', 270)
) as v(code, name_en, name_ar, zone_code, position)
join public.shipping_zones z on z.code = v.zone_code;

insert into public.shipping_cities (governorate_code, code, name_en, name_ar, position) values
  ('cairo','nasr_city','Nasr City','مدينة نصر',10), ('cairo','heliopolis','Heliopolis','مصر الجديدة',20),
  ('cairo','new_cairo','New Cairo','القاهرة الجديدة',30), ('cairo','maadi','Maadi','المعادي',40),
  ('cairo','downtown','Downtown Cairo','وسط القاهرة',50), ('cairo','mokattam','Mokattam','المقطم',60),
  ('cairo','helwan','Helwan','حلوان',70), ('cairo','shorouk','El Shorouk','الشروق',80), ('cairo','badr','Badr City','مدينة بدر',90),
  ('giza','giza_city','Giza','الجيزة',10), ('giza','dokki','Dokki','الدقي',20), ('giza','mohandessin','Mohandessin','المهندسين',30),
  ('giza','october','6th of October','السادس من أكتوبر',40), ('giza','sheikh_zayed','Sheikh Zayed','الشيخ زايد',50),
  ('giza','haram','Haram','الهرم',60), ('giza','faisal','Faisal','فيصل',70), ('giza','imbaba','Imbaba','إمبابة',80),
  ('alexandria','alexandria_city','Alexandria','الإسكندرية',10), ('alexandria','smouha','Smouha','سموحة',20),
  ('alexandria','agami','Agami','العجمي',30), ('alexandria','borg_el_arab','Borg El Arab','برج العرب',40),
  ('dakahlia','mansoura','Mansoura','المنصورة',10), ('dakahlia','talkha','Talkha','طلخا',20), ('dakahlia','mit_ghamr','Mit Ghamr','ميت غمر',30),
  ('red_sea','hurghada','Hurghada','الغردقة',10), ('red_sea','safaga','Safaga','سفاجا',20), ('red_sea','marsa_alam','Marsa Alam','مرسى علم',30),
  ('beheira','damanhour','Damanhour','دمنهور',10), ('beheira','kafr_el_dawar','Kafr El Dawar','كفر الدوار',20), ('beheira','rashid','Rashid','رشيد',30),
  ('fayoum','fayoum_city','Fayoum','الفيوم',10), ('fayoum','senores','Senores','سنورس',20),
  ('gharbia','tanta','Tanta','طنطا',10), ('gharbia','mahalla','El Mahalla El Kubra','المحلة الكبرى',20), ('gharbia','kafr_el_zayat','Kafr El Zayat','كفر الزيات',30),
  ('ismailia','ismailia_city','Ismailia','الإسماعيلية',10), ('ismailia','fayed','Fayed','فايد',20),
  ('monufia','shebin_el_kom','Shebin El Kom','شبين الكوم',10), ('monufia','sadat','Sadat City','مدينة السادات',20), ('monufia','menouf','Menouf','منوف',30),
  ('minya','minya_city','Minya','المنيا',10), ('minya','mallawi','Mallawi','ملوي',20), ('minya','samalut','Samalut','سمالوط',30),
  ('qalyubia','banha','Banha','بنها',10), ('qalyubia','shubra_el_kheima','Shubra El Kheima','شبرا الخيمة',20), ('qalyubia','obour','Obour City','مدينة العبور',30),
  ('new_valley','kharga','Kharga','الخارجة',10), ('new_valley','dakhla','Dakhla','الداخلة',20),
  ('suez','suez_city','Suez','السويس',10),
  ('aswan','aswan_city','Aswan','أسوان',10), ('aswan','kom_ombo','Kom Ombo','كوم أمبو',20), ('aswan','edfu','Edfu','إدفو',30),
  ('assiut','assiut_city','Assiut','أسيوط',10), ('assiut','dayrut','Dayrut','ديروط',20), ('assiut','manfalut','Manfalut','منفلوط',30),
  ('beni_suef','beni_suef_city','Beni Suef','بني سويف',10), ('beni_suef','new_beni_suef','New Beni Suef','بني سويف الجديدة',20),
  ('port_said','port_said_city','Port Said','بورسعيد',10), ('port_said','port_fouad','Port Fouad','بورفؤاد',20),
  ('damietta','damietta_city','Damietta','دمياط',10), ('damietta','new_damietta','New Damietta','دمياط الجديدة',20), ('damietta','ras_el_bar','Ras El Bar','رأس البر',30),
  ('sharqia','zagazig','Zagazig','الزقازيق',10), ('sharqia','tenth_ramadan','10th of Ramadan','العاشر من رمضان',20), ('sharqia','belbeis','Belbeis','بلبيس',30),
  ('south_sinai','sharm_el_sheikh','Sharm El Sheikh','شرم الشيخ',10), ('south_sinai','dahab','Dahab','دهب',20), ('south_sinai','tor','El Tor','الطور',30),
  ('kafr_el_sheikh','kafr_el_sheikh_city','Kafr El Sheikh','كفر الشيخ',10), ('kafr_el_sheikh','desouk','Desouk','دسوق',20), ('kafr_el_sheikh','baltim','Baltim','بلطيم',30),
  ('matrouh','marsa_matrouh','Marsa Matrouh','مرسى مطروح',10), ('matrouh','alamein','Alamein','العلمين',20), ('matrouh','siwa','Siwa','سيوة',30),
  ('luxor','luxor_city','Luxor','الأقصر',10), ('luxor','esna','Esna','إسنا',20),
  ('qena','qena_city','Qena','قنا',10), ('qena','nag_hammadi','Nag Hammadi','نجع حمادي',20),
  ('north_sinai','arish','Arish','العريش',10), ('north_sinai','bir_el_abd','Bir El Abd','بئر العبد',20),
  ('sohag','sohag_city','Sohag','سوهاج',10), ('sohag','akhmim','Akhmim','أخميم',20), ('sohag','girga','Girga','جرجا',30);

alter table public.orders
  add column shipping_zone_id bigint references public.shipping_zones(id) on delete set null,
  add column shipping_zone_code text,
  add column shipping_zone_name_en text,
  add column shipping_zone_name_ar text,
  add column shipping_governorate_code text,
  add column shipping_governorate_name_en text,
  add column shipping_governorate_name_ar text,
  add column shipping_city_code text,
  add column shipping_city_name_en text,
  add column shipping_city_name_ar text,
  add column shipping_base_minor bigint not null default 0 check (shipping_base_minor >= 0),
  add column shipping_discount_minor bigint not null default 0 check (shipping_discount_minor >= 0),
  add column cod_surcharge_minor bigint not null default 0 check (cod_surcharge_minor >= 0),
  add column delivery_min_days smallint check (delivery_min_days between 1 and 30),
  add column delivery_max_days smallint check (delivery_max_days between 1 and 45),
  add constraint orders_shipping_discount_valid check (shipping_discount_minor <= shipping_base_minor),
  add constraint orders_delivery_range_valid check (
    delivery_min_days is null or delivery_max_days is null or delivery_max_days >= delivery_min_days
  );

create index orders_shipping_zone_created_idx
  on public.orders (shipping_zone_id, created_at desc)
  where shipping_zone_id is not null;

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
  v_zone record;
  v_city record;
  v_quantity integer;
  v_subtotal bigint := 0;
  v_shipping_base bigint := 0;
  v_shipping_discount bigint := 0;
  v_cod_surcharge bigint := 0;
  v_shipping bigint := 0;
  v_cod_deposit bigint := 0;
  v_available integer;
  v_item_count integer := 0;
  v_deposit_method text;
  v_city_code text;
  v_city_en text;
  v_city_ar text;
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

  select
    z.id, z.code, z.name_en, z.name_ar, z.shipping_fee_minor,
    z.free_shipping_threshold_minor, z.cod_enabled, z.cod_surcharge_minor,
    z.delivery_min_days, z.delivery_max_days,
    g.code as governorate_code, g.name_en as governorate_name_en,
    g.name_ar as governorate_name_ar
  into v_zone
  from public.shipping_governorates g
  join public.shipping_zones z on z.id = g.zone_id
  where g.code = p_order ->> 'governorate_code'
    and g.is_active and z.is_active;

  if v_zone.id is null then
    raise exception 'SHIPPING_AREA_UNAVAILABLE' using errcode = 'P0001';
  end if;
  if v_method = 'cod' and not v_zone.cod_enabled then
    raise exception 'COD_UNAVAILABLE_FOR_ZONE' using errcode = 'P0001';
  end if;

  v_city_code := p_order ->> 'city_code';
  if v_city_code = 'other' then
    v_city_en := trim(p_order ->> 'city');
    v_city_ar := v_city_en;
    if char_length(v_city_en) < 2 or char_length(v_city_en) > 100 then
      raise exception 'INVALID_CITY' using errcode = 'P0001';
    end if;
  else
    select c.name_en, c.name_ar into v_city
    from public.shipping_cities c
    where c.governorate_code = v_zone.governorate_code
      and c.code = v_city_code and c.is_active;
    if v_city.name_en is null then
      raise exception 'INVALID_CITY' using errcode = 'P0001';
    end if;
    v_city_en := v_city.name_en;
    v_city_ar := v_city.name_ar;
  end if;

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
    cod_deposit_method, reservation_expires_at,
    shipping_zone_id, shipping_zone_code, shipping_zone_name_en, shipping_zone_name_ar,
    shipping_governorate_code, shipping_governorate_name_en, shipping_governorate_name_ar,
    shipping_city_code, shipping_city_name_en, shipping_city_name_ar,
    delivery_min_days, delivery_max_days
  ) values (
    v_order_id, v_order_number, p_user_id, p_tracking_token_hash,
    trim(p_order ->> 'customer_name'), nullif(trim(p_order ->> 'email'), ''),
    v_verification.phone, v_verification.verified_at, v_zone.governorate_name_en,
    v_city_en, trim(p_order ->> 'street_address'),
    nullif(trim(p_order ->> 'building'), ''), nullif(trim(p_order ->> 'floor'), ''),
    nullif(trim(p_order ->> 'apartment'), ''), nullif(trim(p_order ->> 'landmark'), ''),
    nullif(trim(p_order ->> 'customer_notes'), ''), v_status, v_payment_status, v_method,
    v_deposit_method,
    case when v_method = 'paymob' then now() + interval '30 minutes'
         when v_method in ('cod', 'vodafone_cash', 'instapay') then now() + interval '24 hours'
         else null end,
    v_zone.id, v_zone.code, v_zone.name_en, v_zone.name_ar,
    v_zone.governorate_code, v_zone.governorate_name_en, v_zone.governorate_name_ar,
    v_city_code, v_city_en, v_city_ar, v_zone.delivery_min_days, v_zone.delivery_max_days
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
  v_shipping_base := v_zone.shipping_fee_minor;
  if v_zone.free_shipping_threshold_minor is not null
     and v_subtotal >= v_zone.free_shipping_threshold_minor then
    v_shipping_discount := v_shipping_base;
  end if;
  if v_method = 'cod' then v_cod_surcharge := v_zone.cod_surcharge_minor; end if;
  v_shipping := v_shipping_base - v_shipping_discount + v_cod_surcharge;

  update public.orders set
    subtotal_minor = v_subtotal,
    shipping_minor = v_shipping,
    shipping_base_minor = v_shipping_base,
    shipping_discount_minor = v_shipping_discount,
    cod_surcharge_minor = v_cod_surcharge,
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
    'shipping_minor', v_shipping, 'shipping_base_minor', v_shipping_base,
    'shipping_discount_minor', v_shipping_discount, 'cod_surcharge_minor', v_cod_surcharge,
    'total_minor', v_subtotal + v_shipping, 'cod_deposit_minor', v_cod_deposit,
    'cod_balance_due_minor', case when v_method = 'cod' then v_subtotal + v_shipping - v_cod_deposit else 0 end,
    'status', v_status, 'payment_status', v_payment_status
  );
end;
$$;
