-- Commercial growth suite: merchandising, stock lifecycle, returns and reporting.

create type public.bundle_status as enum ('draft', 'active', 'archived');
create type public.product_relation_kind as enum ('cross_sell', 'complete_the_look');
create type public.stock_subscription_status as enum ('active', 'notified', 'unsubscribed');
create type public.inventory_alert_status as enum ('open', 'resolved');
create type public.return_request_type as enum ('return', 'exchange');
create type public.return_request_status as enum (
  'requested', 'reviewing', 'approved', 'rejected', 'received', 'completed', 'cancelled'
);
create type public.return_resolution as enum ('refund', 'exchange', 'store_credit');

create table public.product_bundles (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title_en text not null check (char_length(title_en) between 2 and 120),
  title_ar text not null check (char_length(title_ar) between 2 and 120),
  description_en text not null default '' check (char_length(description_en) <= 600),
  description_ar text not null default '' check (char_length(description_ar) <= 600),
  status public.bundle_status not null default 'draft',
  position integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.product_bundle_items (
  bundle_id bigint not null references public.product_bundles(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity between 1 and 10),
  position integer not null default 0,
  primary key (bundle_id, product_id)
);
create index product_bundle_items_product_idx on public.product_bundle_items(product_id, bundle_id);

create table public.product_recommendations (
  product_id bigint not null references public.products(id) on delete cascade,
  related_product_id bigint not null references public.products(id) on delete cascade,
  kind public.product_relation_kind not null default 'cross_sell',
  position integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (product_id, related_product_id, kind),
  check (product_id <> related_product_id)
);
create index product_recommendations_related_idx on public.product_recommendations(related_product_id);
create index product_recommendations_active_idx on public.product_recommendations(product_id, kind, position) where is_active;

create table public.stock_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  variant_id bigint references public.product_variants(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  locale text not null default 'en' check (locale in ('en', 'ar')),
  status public.stock_subscription_status not null default 'active',
  unsubscribe_token_hash text not null unique,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index stock_subscriptions_active_email_variant_idx
  on public.stock_subscriptions(lower(email), product_id, coalesce(variant_id, 0))
  where status = 'active';
create index stock_subscriptions_user_created_idx on public.stock_subscriptions(user_id, created_at desc) where user_id is not null;
create index stock_subscriptions_active_variant_idx on public.stock_subscriptions(variant_id, created_at) where status = 'active';
create index stock_subscriptions_active_product_idx on public.stock_subscriptions(product_id, created_at) where status = 'active' and variant_id is null;

create table public.inventory_alerts (
  id bigint generated always as identity primary key,
  variant_id bigint not null references public.product_variants(id) on delete cascade,
  status public.inventory_alert_status not null default 'open',
  available_quantity integer not null check (available_quantity >= 0),
  threshold integer not null check (threshold >= 0),
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  last_notified_at timestamptz,
  resolved_at timestamptz
);
create unique index inventory_alerts_open_variant_idx on public.inventory_alerts(variant_id) where status = 'open';
create index inventory_alerts_status_detected_idx on public.inventory_alerts(status, last_detected_at desc);

create table public.return_requests (
  id uuid primary key default gen_random_uuid(),
  return_number text not null unique,
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  request_type public.return_request_type not null,
  status public.return_request_status not null default 'requested',
  resolution public.return_resolution,
  reason_code text not null check (reason_code in ('size', 'colour', 'damaged', 'incorrect', 'quality', 'changed_mind', 'other')),
  customer_note text check (customer_note is null or char_length(customer_note) <= 1000),
  staff_note text check (staff_note is null or char_length(staff_note) <= 1000),
  evidence_paths text[] not null default '{}',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  received_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index return_requests_order_idx on public.return_requests(order_id, requested_at desc);
create index return_requests_user_idx on public.return_requests(user_id, requested_at desc) where user_id is not null;
create index return_requests_status_idx on public.return_requests(status, requested_at desc);

create table public.return_request_items (
  id bigint generated always as identity primary key,
  return_request_id uuid not null references public.return_requests(id) on delete cascade,
  order_item_id bigint not null references public.order_items(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 10),
  requested_colour text check (requested_colour is null or char_length(requested_colour) <= 80),
  requested_size text check (requested_size is null or char_length(requested_size) <= 40),
  condition_note text check (condition_note is null or char_length(condition_note) <= 500),
  unique (return_request_id, order_item_id)
);
create index return_request_items_order_item_idx on public.return_request_items(order_item_id);

create table public.return_status_history (
  id bigint generated always as identity primary key,
  return_request_id uuid not null references public.return_requests(id) on delete cascade,
  status public.return_request_status not null,
  note text check (note is null or char_length(note) <= 1000),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index return_status_history_request_idx on public.return_status_history(return_request_id, created_at);
create index return_status_history_actor_idx on public.return_status_history(actor_id) where actor_id is not null;

create or replace function public.touch_commercial_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger product_bundles_touch_updated_at before update on public.product_bundles
for each row execute function public.touch_commercial_updated_at();
create trigger stock_subscriptions_touch_updated_at before update on public.stock_subscriptions
for each row execute function public.touch_commercial_updated_at();
create trigger return_requests_touch_updated_at before update on public.return_requests
for each row execute function public.touch_commercial_updated_at();

alter table public.product_bundles enable row level security;
alter table public.product_bundle_items enable row level security;
alter table public.product_recommendations enable row level security;
alter table public.stock_subscriptions enable row level security;
alter table public.inventory_alerts enable row level security;
alter table public.return_requests enable row level security;
alter table public.return_request_items enable row level security;
alter table public.return_status_history enable row level security;

revoke all on public.product_bundles, public.product_bundle_items, public.product_recommendations,
  public.stock_subscriptions, public.inventory_alerts, public.return_requests,
  public.return_request_items, public.return_status_history from anon, authenticated;

grant select on public.product_bundles, public.product_bundle_items, public.product_recommendations to anon, authenticated;
grant insert, update, delete on public.product_bundles, public.product_bundle_items, public.product_recommendations to authenticated;
grant select on public.stock_subscriptions, public.return_requests, public.return_request_items, public.return_status_history to authenticated;
grant select, insert, update on public.inventory_alerts to authenticated;
grant usage, select on sequence public.product_bundles_id_seq, public.inventory_alerts_id_seq,
  public.return_request_items_id_seq, public.return_status_history_id_seq to authenticated;

create policy product_bundles_public_select on public.product_bundles for select to anon, authenticated
using (
  status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
);
create policy product_bundles_staff_select on public.product_bundles for select to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));
create policy product_bundles_staff_insert on public.product_bundles for insert to authenticated
with check ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));
create policy product_bundles_staff_update on public.product_bundles for update to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));
create policy product_bundles_staff_delete on public.product_bundles for delete to authenticated
using ((select private.has_any_role(array['admin','super_admin']::public.app_role[])));

create policy product_bundle_items_public_select on public.product_bundle_items for select to anon, authenticated
using (exists (
  select 1 from public.product_bundles b where b.id = bundle_id
    and b.status = 'active' and (b.starts_at is null or b.starts_at <= now()) and (b.ends_at is null or b.ends_at > now())
));
create policy product_bundle_items_staff_select on public.product_bundle_items for select to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));
create policy product_bundle_items_staff_insert on public.product_bundle_items for insert to authenticated
with check ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));
create policy product_bundle_items_staff_update on public.product_bundle_items for update to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));
create policy product_bundle_items_staff_delete on public.product_bundle_items for delete to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));

create policy product_recommendations_public_select on public.product_recommendations for select to anon, authenticated
using (is_active);
create policy product_recommendations_staff_select on public.product_recommendations for select to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));
create policy product_recommendations_staff_insert on public.product_recommendations for insert to authenticated
with check ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));
create policy product_recommendations_staff_update on public.product_recommendations for update to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));
create policy product_recommendations_staff_delete on public.product_recommendations for delete to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[])));

create policy stock_subscriptions_customer_select on public.stock_subscriptions for select to authenticated
using ((select auth.uid()) = user_id);
create policy stock_subscriptions_staff_select on public.stock_subscriptions for select to authenticated
using ((select private.has_any_role(array['support','product_manager','analyst','admin','super_admin']::public.app_role[])));

create policy inventory_alerts_staff_select on public.inventory_alerts for select to authenticated
using ((select private.has_any_role(array['warehouse','product_manager','analyst','admin','super_admin']::public.app_role[])));
create policy inventory_alerts_staff_insert on public.inventory_alerts for insert to authenticated
with check ((select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[])));
create policy inventory_alerts_staff_update on public.inventory_alerts for update to authenticated
using ((select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['warehouse','product_manager','admin','super_admin']::public.app_role[])));

create policy return_requests_customer_select on public.return_requests for select to authenticated
using ((select auth.uid()) = user_id);
create policy return_requests_staff_select on public.return_requests for select to authenticated
using ((select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[])));
create policy return_request_items_customer_select on public.return_request_items for select to authenticated
using (exists (select 1 from public.return_requests r where r.id = return_request_id and r.user_id = (select auth.uid())));
create policy return_request_items_staff_select on public.return_request_items for select to authenticated
using ((select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[])));
create policy return_status_history_customer_select on public.return_status_history for select to authenticated
using (exists (select 1 from public.return_requests r where r.id = return_request_id and r.user_id = (select auth.uid())));
create policy return_status_history_staff_select on public.return_status_history for select to authenticated
using ((select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[])));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('return-evidence', 'return-evidence', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Seed two useful complete-the-look sets and bidirectional lab-coat cross-sells when the catalogue exists.
insert into public.product_bundles (slug, title_en, title_ar, description_en, description_ar, status, position)
values
  ('women-shift-essentials', 'Women’s shift essentials', 'أساسيات الشيفت الحريمي', 'A coordinated scrub set and clinical lab coat for a complete work rotation.', 'سكراب وبالطو طبي متناسقان لإطلالة عمل متكاملة.', 'active', 10),
  ('men-shift-essentials', 'Men’s shift essentials', 'أساسيات الشيفت الرجالي', 'A practical scrub set and clinical lab coat selected for everyday rounds.', 'سكراب وبالطو طبي عمليان لجولات العمل اليومية.', 'active', 20)
on conflict (slug) do nothing;

insert into public.product_bundle_items (bundle_id, product_id, quantity, position)
select b.id, p.id, 1, x.position
from (values
  ('women-shift-essentials', 'female-design-2-scrub-set', 10),
  ('women-shift-essentials', 'classic-medical-lab-coat', 20),
  ('men-shift-essentials', 'male-design-1-scrub-set', 10),
  ('men-shift-essentials', 'classic-medical-lab-coat', 20)
) as x(bundle_slug, product_slug, position)
join public.product_bundles b on b.slug = x.bundle_slug
join public.products p on p.slug = x.product_slug
on conflict (bundle_id, product_id) do nothing;

insert into public.product_recommendations (product_id, related_product_id, kind, position)
select p.id, coat.id, 'complete_the_look', 10
from public.products p
cross join lateral (select id from public.products where slug = 'classic-medical-lab-coat' limit 1) coat
where p.slug like '%scrub-set' and p.id <> coat.id
on conflict (product_id, related_product_id, kind) do nothing;

insert into public.product_recommendations (product_id, related_product_id, kind, position)
select coat.id, p.id, 'cross_sell', row_number() over (order by p.id)::integer * 10
from public.products coat
join public.products p on p.slug like '%scrub-set'
where coat.slug = 'classic-medical-lab-coat'
on conflict (product_id, related_product_id, kind) do nothing;
