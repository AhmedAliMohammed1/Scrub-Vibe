-- Storefront Merchandising CMS: banners table, storage bucket and RLS
-- Supports announcement bars, hero banners and promotional sections
-- with bilingual content, scheduling, image assets and admin-only management

-- ─── Table ──────────────────────────────────────────────────────────────────

create table if not exists public.cms_banners (
  id               bigint generated always as identity primary key,
  type             text not null check (type in ('announcement', 'hero', 'promo')),
  title_en         text not null default '',
  title_ar         text not null default '',
  subtitle_en      text,
  subtitle_ar      text,
  body_en          text,
  body_ar          text,
  cta_text_en      text,
  cta_text_ar      text,
  cta_url          text,
  secondary_cta_text_en text,
  secondary_cta_text_ar text,
  secondary_cta_url     text,
  image_path       text,
  bg_color         text not null default '#073b36',
  text_color       text not null default '#ffffff',
  overlay_opacity  int not null default 60 check (overlay_opacity between 0 and 100),
  position         int not null default 0,
  is_active        boolean not null default true,
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists cms_banners_type_position_idx
  on public.cms_banners (type, position);

create index if not exists cms_banners_active_schedule_idx
  on public.cms_banners (is_active, starts_at, ends_at);

-- ─── Auto-update updated_at trigger ─────────────────────────────────────────

create or replace function public.handle_cms_banner_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_cms_banner_updated_at on public.cms_banners;
create trigger trg_cms_banner_updated_at
before update on public.cms_banners
for each row
execute function public.handle_cms_banner_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.cms_banners enable row level security;

revoke all on public.cms_banners from anon, authenticated;
grant select on public.cms_banners to anon, authenticated;
grant insert, update, delete on public.cms_banners to authenticated;

-- Public: anyone can read active, currently-scheduled banners
drop policy if exists cms_banners_public_read on public.cms_banners;
create policy cms_banners_public_read
on public.cms_banners for select to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

-- Admin: full read (including inactive/future/expired) for management
drop policy if exists cms_banners_admin_read_all on public.cms_banners;
create policy cms_banners_admin_read_all
on public.cms_banners for select to authenticated
using ((select private.has_any_role(array['admin','super_admin']::public.app_role[])));

-- Admin: insert, update, delete
drop policy if exists cms_banners_admin_manage on public.cms_banners;
create policy cms_banners_admin_manage
on public.cms_banners for all to authenticated
using ((select private.has_any_role(array['admin','super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['admin','super_admin']::public.app_role[])));

-- ─── Supabase Storage: banners bucket ───────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banners', 'banners', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for banner images
create policy banners_public_read
on storage.objects for select to anon, authenticated
using (bucket_id = 'banners');

-- Admin upload
create policy banners_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'banners'
  and (select private.has_any_role(array['admin','super_admin']::public.app_role[]))
);

-- Admin update
create policy banners_admin_update
on storage.objects for update to authenticated
using (
  bucket_id = 'banners'
  and (select private.has_any_role(array['admin','super_admin']::public.app_role[]))
)
with check (
  bucket_id = 'banners'
  and (select private.has_any_role(array['admin','super_admin']::public.app_role[]))
);

-- Admin delete
create policy banners_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'banners'
  and (select private.has_any_role(array['admin','super_admin']::public.app_role[]))
);
