-- Abandoned cart recovery RPC helper: find_abandoned_cart_candidates
-- Efficiently selects users with unpurchased, idle carts meeting time criteria
-- and returns structured cart snapshots for automated email dispatch.

create or replace function public.find_abandoned_cart_candidates(
  p_stage text,
  p_delay_hours integer,
  p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_threshold timestamptz := now() - (p_delay_hours || ' hours')::interval;
  v_result jsonb;
begin
  if p_stage not in ('first_reminder', 'second_reminder', 'discount_offer') then
    raise exception 'INVALID_RECOVERY_STAGE' using errcode = '22023';
  end if;

  with user_carts as (
    select
      ci.user_id,
      max(ci.updated_at) as last_cart_activity,
      count(ci.id) as cart_item_count
    from public.cart_items ci
    group by ci.user_id
    having max(ci.updated_at) <= v_threshold
  ),
  eligible_users as (
    select
      uc.user_id,
      uc.last_cart_activity,
      uc.cart_item_count,
      p.email,
      p.full_name,
      p.preferred_locale
    from user_carts uc
    join public.profiles p on p.id = uc.user_id
    where p.email is not null
      and length(trim(p.email)) >= 3
      and not p.cart_recovery_opt_out
      -- No order placed since the last cart update
      and not exists (
        select 1 from public.orders o
        where o.user_id = uc.user_id
          and o.created_at >= uc.last_cart_activity
      )
      -- No notification for this stage since the last cart update
      and not exists (
        select 1 from public.abandoned_cart_notifications acn
        where acn.user_id = uc.user_id
          and acn.stage = p_stage
          and acn.created_at >= uc.last_cart_activity
      )
      -- Stage progression constraints:
      and (
        p_stage = 'first_reminder'
        or (
          p_stage = 'second_reminder'
          and exists (
            select 1 from public.abandoned_cart_notifications acn1
            where acn1.user_id = uc.user_id
              and acn1.stage = 'first_reminder'
              and acn1.created_at >= uc.last_cart_activity
          )
        )
        or (
          p_stage = 'discount_offer'
          and exists (
            select 1 from public.abandoned_cart_notifications acn2
            where acn2.user_id = uc.user_id
              and acn2.stage = 'second_reminder'
              and acn2.created_at >= uc.last_cart_activity
          )
        )
      )
    order by uc.last_cart_activity asc
    limit p_limit
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', eu.user_id::text,
      'email', eu.email,
      'full_name', eu.full_name,
      'locale', coalesce(eu.preferred_locale, 'en'),
      'last_cart_activity_at', eu.last_cart_activity,
      'cart_item_count', eu.cart_item_count,
      'cart_value_minor', (
        select coalesce(sum(ci.quantity * coalesce(pv.price_override_minor, p.base_price_minor)), 0)
        from public.cart_items ci
        join public.product_variants pv on pv.id = ci.variant_id
        join public.products p on p.id = pv.product_id
        where ci.user_id = eu.user_id and pv.is_active and p.status = 'active'
      ),
      'items', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'variant_id', pv.id::text,
            'product_id', p.id::text,
            'slug', p.slug,
            'title_en', coalesce(en.title, p.slug),
            'title_ar', coalesce(ar.title, en.title, p.slug),
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
            'quantity', ci.quantity,
            'price_minor', coalesce(pv.price_override_minor, p.base_price_minor),
            'line_total_minor', ci.quantity * coalesce(pv.price_override_minor, p.base_price_minor)
          )
          order by ci.created_at asc
        ), '[]'::jsonb)
        from public.cart_items ci
        join public.product_variants pv on pv.id = ci.variant_id
        join public.products p on p.id = pv.product_id
        left join public.product_translations en on en.product_id = p.id and en.locale = 'en'
        left join public.product_translations ar on ar.product_id = p.id and ar.locale = 'ar'
        where ci.user_id = eu.user_id and pv.is_active and p.status = 'active'
      )
    )
  ), '[]'::jsonb)
  into v_result
  from eligible_users eu;

  return v_result;
end;
$$;

revoke execute on function public.find_abandoned_cart_candidates(text, integer, integer) from public, anon, authenticated;
grant execute on function public.find_abandoned_cart_candidates(text, integer, integer) to service_role;
