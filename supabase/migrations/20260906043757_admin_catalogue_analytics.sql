create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null check (event_name in (
    'page_view', 'product_view', 'add_to_cart', 'wishlist_add',
    'begin_checkout', 'newsletter_signup', 'instagram_click'
  )),
  session_id uuid not null,
  anonymous_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  product_id bigint references public.products(id) on delete set null,
  locale text check (locale is null or locale in ('en', 'ar')),
  path text not null check (char_length(path) between 1 and 500),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 255),
  utm_source text check (utm_source is null or char_length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 150),
  device_type text check (device_type is null or device_type in ('mobile', 'tablet', 'desktop')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now()
);

create index analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);
create index analytics_events_name_occurred_at_idx
  on public.analytics_events (event_name, occurred_at desc);
create index analytics_events_product_occurred_at_idx
  on public.analytics_events (product_id, occurred_at desc)
  where product_id is not null;
create index analytics_events_session_occurred_at_idx
  on public.analytics_events (session_id, occurred_at desc);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant select on public.analytics_events to authenticated;

create policy analytics_events_staff_select
on public.analytics_events for select to authenticated
using ((select private.has_any_role(array['analyst','admin','super_admin']::public.app_role[])));

create policy profiles_staff_select
on public.profiles for select to authenticated
using ((select private.has_any_role(array['analyst','admin','super_admin']::public.app_role[])));

create policy user_roles_admin_select
on public.user_roles for select to authenticated
using ((select private.has_any_role(array['admin','super_admin']::public.app_role[])));

create policy categories_staff_all
on public.categories for all to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

create policy category_translations_staff_all
on public.category_translations for all to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

create policy products_staff_select
on public.products for select to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

create policy product_translations_staff_all
on public.product_translations for all to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

create policy product_images_staff_all
on public.product_images for all to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

create policy product_options_staff_all
on public.product_options for all to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

create policy product_option_values_staff_all
on public.product_option_values for all to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

create policy product_variants_staff_all
on public.product_variants for all to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

create policy product_variant_values_staff_all
on public.product_variant_values for all to authenticated
using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy product_media_staff_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-media'
  and (select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[]))
);

create policy product_media_staff_update
on storage.objects for update to authenticated
using (
  bucket_id = 'product-media'
  and (select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[]))
)
with check (
  bucket_id = 'product-media'
  and (select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[]))
);

create policy product_media_staff_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'product-media'
  and (select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[]))
);

create or replace function public.track_store_event(
  p_event_name text,
  p_session_id uuid,
  p_anonymous_id uuid,
  p_path text,
  p_locale text default null,
  p_product_id bigint default null,
  p_referrer_host text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_device_type text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_event_name is null or p_event_name not in (
    'page_view', 'product_view', 'add_to_cart', 'wishlist_add',
    'begin_checkout', 'newsletter_signup', 'instagram_click'
  ) then
    raise exception 'Unsupported analytics event';
  end if;

  if p_path is null or char_length(p_path) not between 1 and 500 or left(p_path, 1) <> '/' then
    raise exception 'Invalid analytics path';
  end if;

  if p_locale is not null and p_locale not in ('en', 'ar') then
    raise exception 'Invalid analytics locale';
  end if;

  if p_device_type is not null and p_device_type not in ('mobile', 'tablet', 'desktop') then
    raise exception 'Invalid device type';
  end if;

  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' or pg_column_size(p_metadata) > 4096 then
    raise exception 'Invalid analytics metadata';
  end if;

  insert into public.analytics_events (
    event_name,
    session_id,
    anonymous_id,
    user_id,
    product_id,
    locale,
    path,
    referrer_host,
    utm_source,
    utm_medium,
    utm_campaign,
    device_type,
    metadata
  ) values (
    p_event_name,
    p_session_id,
    p_anonymous_id,
    auth.uid(),
    p_product_id,
    p_locale,
    left(p_path, 500),
    nullif(left(coalesce(p_referrer_host, ''), 255), ''),
    nullif(left(coalesce(p_utm_source, ''), 100), ''),
    nullif(left(coalesce(p_utm_medium, ''), 100), ''),
    nullif(left(coalesce(p_utm_campaign, ''), 150), ''),
    p_device_type,
    p_metadata
  );
end;
$$;

revoke execute on function public.track_store_event(text, uuid, uuid, text, text, bigint, text, text, text, text, text, jsonb) from public;
grant execute on function public.track_store_event(text, uuid, uuid, text, text, bigint, text, text, text, text, text, jsonb) to anon, authenticated;

create or replace function public.admin_create_product(
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
  p_color_code text,
  p_color_en text,
  p_color_ar text,
  p_swatch_hex text,
  p_image_url text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_product_id bigint;
  v_color_option_id bigint;
  v_size_option_id bigint;
  v_color_value_id bigint;
  v_size_value_id bigint;
  v_variant_id bigint;
  v_size text;
  v_size_code text;
  v_sku_prefix text;
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
    or p_swatch_hex !~ '^#[0-9A-Fa-f]{6}$'
    or p_gender not in ('men', 'women', 'boys', 'girls', 'unisex') then
    raise exception 'Invalid product data';
  end if;

  if not exists (select 1 from public.categories where id = p_category_id) then
    raise exception 'Category not found';
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
  values (v_product_id, 'color', 'Color', 'اللون', 10)
  returning id into v_color_option_id;

  insert into public.product_options (product_id, code, name_en, name_ar, position)
  values (v_product_id, 'size', 'Size', 'المقاس', 20)
  returning id into v_size_option_id;

  insert into public.product_option_values (
    option_id, code, label_en, label_ar, swatch_hex, position
  ) values (
    v_color_option_id,
    lower(trim(p_color_code)),
    trim(p_color_en),
    trim(p_color_ar),
    p_swatch_hex,
    10
  ) returning id into v_color_value_id;

  v_sku_prefix := upper(regexp_replace(p_slug, '[^a-zA-Z0-9]+', '-', 'g'));

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
    ) returning id into v_size_value_id;

    insert into public.product_variants (product_id, sku, is_active)
    values (v_product_id, 'SV-' || v_sku_prefix || '-' || upper(v_size_code), true)
    returning id into v_variant_id;

    insert into public.product_variant_values (variant_id, option_value_id)
    values (v_variant_id, v_color_value_id), (v_variant_id, v_size_value_id);

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

  return v_product_id;
end;
$$;

revoke execute on function public.admin_create_product(text, text, text, bigint, bigint, text, text[], integer, integer, public.product_status, text, text, bigint, bigint, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.admin_create_product(text, text, text, bigint, bigint, text, text[], integer, integer, public.product_status, text, text, bigint, bigint, text, text, text, text, text, text, text) to authenticated;

create or replace function public.admin_set_product_status(
  p_product_id bigint,
  p_status public.product_status
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.products
  set status = p_status,
      published_at = case when p_status = 'active' then coalesce(published_at, now()) else published_at end,
      scheduled_for = case when p_status = 'scheduled' then coalesce(scheduled_for, now()) else null end,
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_product_id;

  if not found then
    raise exception 'Product not found';
  end if;
end;
$$;

revoke execute on function public.admin_set_product_status(bigint, public.product_status) from public, anon;
grant execute on function public.admin_set_product_status(bigint, public.product_status) to authenticated;

create or replace function public.admin_adjust_inventory(
  p_variant_id bigint,
  p_new_on_hand integer,
  p_reason text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old_on_hand integer;
  v_reserved integer;
  v_delta integer;
begin
  if not (select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[])) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_new_on_hand < 0 or char_length(trim(coalesce(p_reason, ''))) not between 3 and 240 then
    raise exception 'Invalid inventory adjustment';
  end if;

  select on_hand, reserved into v_old_on_hand, v_reserved
  from public.inventory
  where variant_id = p_variant_id
  for update;

  if not found then
    raise exception 'Inventory record not found';
  end if;

  if p_new_on_hand < v_reserved then
    raise exception 'Stock cannot be lower than reserved quantity';
  end if;

  v_delta := p_new_on_hand - v_old_on_hand;
  if v_delta = 0 then
    return;
  end if;

  update public.inventory
  set on_hand = p_new_on_hand, updated_at = now()
  where variant_id = p_variant_id;

  insert into public.inventory_movements (
    variant_id, movement_type, quantity_delta, reason, actor_id
  ) values (
    p_variant_id, 'adjustment', v_delta, trim(p_reason), auth.uid()
  );
end;
$$;

revoke execute on function public.admin_adjust_inventory(bigint, integer, text) from public, anon;
grant execute on function public.admin_adjust_inventory(bigint, integer, text) to authenticated;

create or replace function public.admin_analytics_summary(p_days integer default 30)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_previous_start timestamptz;
  v_result jsonb;
begin
  if not (select private.has_any_role(array['analyst','admin','super_admin']::public.app_role[])) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_days not in (7, 30, 90) then
    raise exception 'Analytics range must be 7, 30, or 90 days';
  end if;

  v_start := date_trunc('day', now()) - make_interval(days => p_days - 1);
  v_previous_start := v_start - make_interval(days => p_days);

  with current_events as (
    select * from public.analytics_events where occurred_at >= v_start
  ),
  previous_events as (
    select * from public.analytics_events
    where occurred_at >= v_previous_start and occurred_at < v_start
  ),
  current_metrics as (
    select
      count(*) filter (where event_name = 'page_view')::int as page_views,
      count(distinct anonymous_id)::int as visitors,
      count(distinct session_id)::int as sessions,
      count(*) filter (where event_name = 'product_view')::int as product_views,
      count(*) filter (where event_name = 'add_to_cart')::int as add_to_carts,
      count(*) filter (where event_name = 'begin_checkout')::int as checkouts,
      count(*) filter (where event_name = 'wishlist_add')::int as wishlist_adds,
      count(*) filter (where event_name = 'newsletter_signup')::int as newsletter_signups,
      count(*) filter (where event_name = 'instagram_click')::int as instagram_clicks
    from current_events
  ),
  previous_metrics as (
    select
      count(*) filter (where event_name = 'page_view')::int as page_views,
      count(distinct anonymous_id)::int as visitors,
      count(distinct session_id)::int as sessions
    from previous_events
  )
  select jsonb_build_object(
    'rangeDays', p_days,
    'metrics', jsonb_build_object(
      'pageViews', c.page_views,
      'visitors', c.visitors,
      'sessions', c.sessions,
      'productViews', c.product_views,
      'addToCarts', c.add_to_carts,
      'checkouts', c.checkouts,
      'wishlistAdds', c.wishlist_adds,
      'newsletterSignups', c.newsletter_signups,
      'instagramClicks', c.instagram_clicks,
      'cartRate', case when c.product_views = 0 then 0 else round(c.add_to_carts * 100.0 / c.product_views, 1) end,
      'checkoutRate', case when c.sessions = 0 then 0 else round(c.checkouts * 100.0 / c.sessions, 1) end
    ),
    'previous', jsonb_build_object(
      'pageViews', p.page_views,
      'visitors', p.visitors,
      'sessions', p.sessions
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'date', d.day::date,
        'pageViews', d.page_views,
        'visitors', d.visitors
      ) order by d.day), '[]'::jsonb)
      from (
        select days.day,
          count(e.id) filter (where e.event_name = 'page_view')::int as page_views,
          count(distinct e.anonymous_id)::int as visitors
        from generate_series(date_trunc('day', v_start), date_trunc('day', now()), interval '1 day') days(day)
        left join current_events e
          on e.occurred_at >= days.day and e.occurred_at < days.day + interval '1 day'
        group by days.day
      ) d
    ),
    'topProducts', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.product_views desc), '[]'::jsonb)
      from (
        select e.product_id as id,
          coalesce(max(pt.title), 'Product #' || e.product_id::text) as title,
          count(*) filter (where e.event_name = 'product_view')::int as product_views,
          count(*) filter (where e.event_name = 'add_to_cart')::int as add_to_carts,
          count(*) filter (where e.event_name = 'wishlist_add')::int as wishlist_adds
        from current_events e
        left join public.product_translations pt
          on pt.product_id = e.product_id and pt.locale = 'en'
        where e.product_id is not null
        group by e.product_id
        order by product_views desc
        limit 8
      ) t
    ),
    'topPages', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.views desc), '[]'::jsonb)
      from (
        select path, count(*)::int as views, count(distinct anonymous_id)::int as visitors
        from current_events
        where event_name = 'page_view'
        group by path
        order by views desc
        limit 8
      ) t
    ),
    'channels', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.visitors desc), '[]'::jsonb)
      from (
        select coalesce(nullif(utm_source, ''), nullif(referrer_host, ''), 'Direct') as channel,
          count(distinct anonymous_id)::int as visitors
        from current_events
        where event_name = 'page_view'
        group by 1
        order by visitors desc
        limit 8
      ) t
    ),
    'devices', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.visitors desc), '[]'::jsonb)
      from (
        select coalesce(device_type, 'unknown') as device,
          count(distinct anonymous_id)::int as visitors
        from current_events
        group by 1
      ) t
    ),
    'locales', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.visitors desc), '[]'::jsonb)
      from (
        select coalesce(locale, 'unknown') as locale,
          count(distinct anonymous_id)::int as visitors
        from current_events
        group by 1
      ) t
    )
  ) into v_result
  from current_metrics c cross join previous_metrics p;

  return v_result;
end;
$$;

revoke execute on function public.admin_analytics_summary(integer) from public, anon;
grant execute on function public.admin_analytics_summary(integer) to authenticated;

create table public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique check (
    char_length(email) between 5 and 320
    and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  locale text not null default 'en' check (locale in ('en', 'ar')),
  source text not null default 'website' check (char_length(source) <= 50),
  is_active boolean not null default true,
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon, authenticated;
grant select on public.newsletter_subscribers to authenticated;

create policy newsletter_subscribers_staff_select
on public.newsletter_subscribers for select to authenticated
using ((select private.has_any_role(array['analyst','admin','super_admin']::public.app_role[])));

create or replace function public.subscribe_newsletter(p_email text, p_locale text default 'en')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if char_length(v_email) not between 5 and 320
    or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    or p_locale not in ('en', 'ar') then
    raise exception 'Invalid newsletter subscription';
  end if;

  insert into public.newsletter_subscribers (email, locale)
  values (v_email, p_locale)
  on conflict (email) do update set
    locale = excluded.locale,
    is_active = true,
    consented_at = now(),
    unsubscribed_at = null;
end;
$$;

revoke execute on function public.subscribe_newsletter(text, text) from public;
grant execute on function public.subscribe_newsletter(text, text) to anon, authenticated;

