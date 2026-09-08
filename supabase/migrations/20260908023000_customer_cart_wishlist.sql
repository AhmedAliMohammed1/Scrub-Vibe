-- Customer persistent cart and wishlist schema with owner-scoped RLS
create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id bigint not null references public.product_variants(id) on delete cascade,
  quantity integer not null default 1 check (quantity between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

create index if not exists cart_items_user_idx on public.cart_items (user_id);
create index if not exists cart_items_variant_idx on public.cart_items (variant_id);

create table if not exists public.wishlist_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists wishlist_items_user_idx on public.wishlist_items (user_id);
create index if not exists wishlist_items_product_idx on public.wishlist_items (product_id);

alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;

revoke all on public.cart_items, public.wishlist_items from anon, authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select, insert, delete on public.wishlist_items to authenticated;

drop policy if exists cart_items_owner_select on public.cart_items;
create policy cart_items_owner_select
on public.cart_items for select to authenticated
using (auth.uid() = user_id);

drop policy if exists cart_items_owner_insert on public.cart_items;
create policy cart_items_owner_insert
on public.cart_items for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists cart_items_owner_update on public.cart_items;
create policy cart_items_owner_update
on public.cart_items for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists cart_items_owner_delete on public.cart_items;
create policy cart_items_owner_delete
on public.cart_items for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists wishlist_items_owner_select on public.wishlist_items;
create policy wishlist_items_owner_select
on public.wishlist_items for select to authenticated
using (auth.uid() = user_id);

drop policy if exists wishlist_items_owner_insert on public.wishlist_items;
create policy wishlist_items_owner_insert
on public.wishlist_items for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists wishlist_items_owner_delete on public.wishlist_items;
create policy wishlist_items_owner_delete
on public.wishlist_items for delete to authenticated
using (auth.uid() = user_id);

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
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_variant_id bigint;
  v_qty integer;
  v_cart_result jsonb := '[]'::jsonb;
  v_wishlist_result jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if p_cart is not null and jsonb_typeof(p_cart) = 'array' then
    for v_item in select value from jsonb_array_elements(p_cart) loop
      v_variant_id := (v_item ->> 'variant_id')::bigint;
      v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
      if v_qty between 1 and 10 and exists (
        select 1 from public.product_variants pv
        join public.products p on p.id = pv.product_id
        where pv.id = v_variant_id and pv.is_active and p.status = 'active'
      ) then
        insert into public.cart_items (user_id, variant_id, quantity)
        values (v_user_id, v_variant_id, v_qty)
        on conflict (user_id, variant_id) do update set
          quantity = least(10, public.cart_items.quantity + excluded.quantity),
          updated_at = now();
      end if;
    end loop;
  end if;

  if p_wishlist is not null and cardinality(p_wishlist) > 0 then
    insert into public.wishlist_items (user_id, product_id)
    select v_user_id, p.id
    from unnest(p_wishlist) as w(id)
    join public.products p on p.id = w.id
    where p.status = 'active'
    on conflict (user_id, product_id) do nothing;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'variant_id', pv.id::text,
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
