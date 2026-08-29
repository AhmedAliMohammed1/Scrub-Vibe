create extension if not exists pg_trgm with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.app_role as enum (
  'customer', 'support', 'warehouse', 'content_editor',
  'product_manager', 'analyst', 'admin', 'super_admin'
);
create type public.product_status as enum ('draft', 'active', 'scheduled', 'archived');
create type public.inventory_movement_type as enum ('receipt', 'reservation', 'release', 'sale', 'return', 'damage', 'adjustment');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'ar')),
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index user_roles_granted_by_idx on public.user_roles(granted_by);

create table public.categories (
  id bigint generated always as identity primary key,
  parent_id bigint references public.categories(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_id_idx on public.categories(parent_id);

create table public.category_translations (
  category_id bigint not null references public.categories(id) on delete cascade,
  locale text not null check (locale in ('en', 'ar')),
  name text not null,
  description text,
  seo_title text,
  seo_description text,
  primary key (category_id, locale)
);

create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint references public.categories(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.product_status not null default 'draft',
  brand text not null default 'NOVA',
  vendor text,
  material text,
  gender text check (gender in ('men', 'women', 'boys', 'girls', 'unisex')),
  fit text,
  base_price_minor bigint not null check (base_price_minor >= 0),
  compare_at_price_minor bigint check (compare_at_price_minor is null or compare_at_price_minor >= base_price_minor),
  cost_minor bigint check (cost_minor is null or cost_minor >= 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  published_at timestamptz,
  scheduled_for timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'active' or published_at is not null),
  check (status <> 'scheduled' or scheduled_for is not null)
);
create index products_category_id_idx on public.products(category_id);
create index products_created_by_idx on public.products(created_by);
create index products_updated_by_idx on public.products(updated_by);
create index products_active_published_idx on public.products(published_at desc) where status = 'active';

create table public.product_translations (
  product_id bigint not null references public.products(id) on delete cascade,
  locale text not null check (locale in ('en', 'ar')),
  title text not null,
  description text,
  care_instructions text,
  seo_title text,
  seo_description text,
  search_document tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored,
  primary key (product_id, locale)
);
create index product_translations_search_idx on public.product_translations using gin(search_document);
create index product_translations_title_trgm_idx on public.product_translations using gin(title extensions.gin_trgm_ops);

create table public.product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_en text not null,
  alt_ar text,
  position integer not null default 0,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);
create index product_images_product_id_idx on public.product_images(product_id, position);

create table public.product_options (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  code text not null,
  name_en text not null,
  name_ar text not null,
  position integer not null default 0,
  unique (product_id, code),
  unique (id, product_id)
);
create index product_options_product_id_idx on public.product_options(product_id);

create table public.product_option_values (
  id bigint generated always as identity primary key,
  option_id bigint not null references public.product_options(id) on delete cascade,
  code text not null,
  label_en text not null,
  label_ar text not null,
  swatch_hex text check (swatch_hex is null or swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 0,
  unique (option_id, code)
);
create index product_option_values_option_id_idx on public.product_option_values(option_id);

create table public.product_variants (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  sku text not null unique,
  barcode text unique,
  price_override_minor bigint check (price_override_minor is null or price_override_minor >= 0),
  compare_at_price_minor bigint check (compare_at_price_minor is null or compare_at_price_minor >= 0),
  cost_minor bigint check (cost_minor is null or cost_minor >= 0),
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, product_id)
);
create index product_variants_product_id_idx on public.product_variants(product_id);

create table public.product_variant_values (
  variant_id bigint not null references public.product_variants(id) on delete cascade,
  option_value_id bigint not null references public.product_option_values(id) on delete restrict,
  primary key (variant_id, option_value_id)
);
create index product_variant_values_option_value_id_idx on public.product_variant_values(option_value_id);

create table public.inventory (
  variant_id bigint primary key references public.product_variants(id) on delete cascade,
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= on_hand),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  variant_id bigint not null references public.product_variants(id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  reference_type text,
  reference_id text,
  reason text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_variant_id_created_at_idx on public.inventory_movements(variant_id, created_at desc);
create index inventory_movements_actor_id_idx on public.inventory_movements(actor_id);

create or replace function private.has_any_role(required_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = any(required_roles)
  );
$$;
revoke execute on function private.has_any_role(public.app_role[]) from public, anon;
grant execute on function private.has_any_role(public.app_role[]) to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.category_translations enable row level security;
alter table public.products enable row level security;
alter table public.product_translations enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.product_option_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_variant_values enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.categories, public.category_translations to anon, authenticated;
grant select on public.products, public.product_translations, public.product_images to anon, authenticated;
grant select on public.product_options, public.product_option_values, public.product_variants, public.product_variant_values, public.inventory to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant insert, update, delete on public.categories, public.category_translations, public.products, public.product_translations, public.product_images, public.product_options, public.product_option_values, public.product_variants, public.product_variant_values to authenticated;
grant select, insert, update on public.inventory to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy user_roles_select_own on public.user_roles for select to authenticated using ((select auth.uid()) = user_id);

create policy categories_public_read on public.categories for select to anon, authenticated using (is_active);
create policy category_translations_public_read on public.category_translations for select to anon, authenticated using (exists (select 1 from public.categories c where c.id = category_id and c.is_active));
create policy products_public_read on public.products for select to anon, authenticated using (status = 'active' and published_at <= now());
create policy product_translations_public_read on public.product_translations for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.published_at <= now()));
create policy product_images_public_read on public.product_images for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.published_at <= now()));
create policy product_options_public_read on public.product_options for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.published_at <= now()));
create policy product_option_values_public_read on public.product_option_values for select to anon, authenticated using (exists (select 1 from public.product_options o join public.products p on p.id = o.product_id where o.id = option_id and p.status = 'active' and p.published_at <= now()));
create policy product_variants_public_read on public.product_variants for select to anon, authenticated using (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.published_at <= now()));
create policy product_variant_values_public_read on public.product_variant_values for select to anon, authenticated using (exists (select 1 from public.product_variants v join public.products p on p.id = v.product_id where v.id = variant_id and v.is_active and p.status = 'active' and p.published_at <= now()));
create policy inventory_public_read on public.inventory for select to anon, authenticated using (exists (select 1 from public.product_variants v join public.products p on p.id = v.product_id where v.id = variant_id and v.is_active and p.status = 'active' and p.published_at <= now()));

create policy products_staff_insert on public.products for insert to authenticated with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));
create policy products_staff_update on public.products for update to authenticated using ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[]))) with check ((select private.has_any_role(array['product_manager','admin','super_admin']::public.app_role[])));
create policy products_staff_delete on public.products for delete to authenticated using ((select private.has_any_role(array['admin','super_admin']::public.app_role[])));
create policy inventory_staff_select on public.inventory for select to authenticated using ((select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[])));
create policy inventory_staff_insert on public.inventory for insert to authenticated with check ((select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[])));
create policy inventory_staff_update on public.inventory for update to authenticated using ((select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[]))) with check ((select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[])));
create policy inventory_movements_staff_select on public.inventory_movements for select to authenticated using ((select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[])));
create policy inventory_movements_staff_insert on public.inventory_movements for insert to authenticated with check (actor_id = (select auth.uid()) and (select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[])));
