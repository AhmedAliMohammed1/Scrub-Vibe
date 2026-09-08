-- Size charts and measurement management with category defaults and per-product overrides
create table if not exists public.size_chart_entries (
  id uuid primary key default gen_random_uuid(),
  product_id bigint references public.products(id) on delete cascade default null,
  category text not null check (category in ('women', 'men', 'unisex')),
  size text not null check (size ~ '^[A-Z0-9]+$'),
  sort_order integer not null default 0,
  chest_min_cm numeric not null check (chest_min_cm > 0),
  chest_max_cm numeric not null check (chest_max_cm >= chest_min_cm),
  waist_min_cm numeric not null check (waist_min_cm > 0),
  waist_max_cm numeric not null check (waist_max_cm >= waist_min_cm),
  hip_min_cm numeric not null check (hip_min_cm > 0),
  hip_max_cm numeric not null check (hip_max_cm >= hip_min_cm),
  inseam_cm numeric check (inseam_cm is null or inseam_cm > 0),
  garment_length_cm numeric check (garment_length_cm is null or garment_length_cm > 0),
  note_en text default null,
  note_ar text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists size_chart_entries_unique_idx
on public.size_chart_entries (category, size, coalesce(product_id, 0));

create index if not exists size_chart_entries_lookup_idx
on public.size_chart_entries (category, product_id, sort_order);

alter table public.size_chart_entries enable row level security;

revoke all on public.size_chart_entries from anon, authenticated;
grant select on public.size_chart_entries to anon, authenticated;
grant insert, update, delete on public.size_chart_entries to authenticated;

drop policy if exists size_chart_entries_public_select on public.size_chart_entries;
create policy size_chart_entries_public_select
on public.size_chart_entries for select to anon, authenticated
using (true);

drop policy if exists size_chart_entries_admin_manage on public.size_chart_entries;
create policy size_chart_entries_admin_manage
on public.size_chart_entries for all to authenticated
using ((select private.has_any_role(array['admin', 'super_admin']::public.app_role[])))
with check ((select private.has_any_role(array['admin', 'super_admin']::public.app_role[])));

-- Seed standard category default measurements (product_id = null)
insert into public.size_chart_entries (
  category, size, sort_order, chest_min_cm, chest_max_cm, waist_min_cm, waist_max_cm, hip_min_cm, hip_max_cm, inseam_cm, garment_length_cm, note_en, note_ar
) values
  -- Women
  ('women', 'XS', 1, 81, 86, 61, 66, 86, 91, 76, 65, 'Tailored slim fit across shoulders and torso', 'قصة ضيقة ومحددة عند الكتفين والصدر'),
  ('women', 'S',  2, 86, 91, 66, 71, 91, 97, 77, 66, 'Standard professional fit for everyday comfort', 'قصة قياسية مريحة للعمل اليومي'),
  ('women', 'M',  3, 91, 97, 71, 76, 97, 102, 78, 67, 'Standard professional fit with stretch ease', 'قصة قياسية مع مرونة مريحة للحركة'),
  ('women', 'L',  4, 97, 104, 76, 84, 102, 109, 78, 69, 'Relaxed comfortable cut for flexible motion', 'قصة واسعة مريحة لحرية حركة كاملة'),
  ('women', 'XL', 5, 104, 112, 84, 91, 109, 117, 79, 70, 'Relaxed roomy silhouette for long shifts', 'قصة رحبة مريحة للنوبات الطويلة'),
  ('women', '2XL', 6, 112, 120, 91, 99, 117, 124, 79, 71, 'Extended comfort fit with generous drape', 'قصة واسعة مريحة مع انسيابية كاملة'),

  -- Men
  ('men', 'S',  1, 89, 94, 74, 79, 89, 94, 79, 71, 'Athletic tailored fit through chest and waist', 'قصة رياضية محددة عند الصدر والخصر'),
  ('men', 'M',  2, 97, 102, 81, 86, 97, 102, 80, 73, 'Standard modern fit for clinical shifts', 'قصة عصرية قياسية للعمل الطبي'),
  ('men', 'L',  3, 104, 109, 89, 94, 104, 109, 81, 75, 'Standard comfortable cut with full arm mobility', 'قصة مريحة مع حرية حركة كاملة للذراعين'),
  ('men', 'XL', 4, 112, 117, 97, 102, 112, 117, 81, 76, 'Roomy fit across shoulders and chest', 'قصة واسعة عند الأكتاف والصدر'),
  ('men', '2XL', 5, 120, 125, 104, 109, 120, 125, 82, 77, 'Generous silhouette for unrestricted movement', 'قصة واسعة لراحة غير مقيدة طوال اليوم'),
  ('men', '3XL', 6, 127, 135, 112, 120, 127, 135, 82, 78, 'Extended relaxed cut designed for comfort', 'قصة رحبة مصممة لأقصى راحة'),

  -- Unisex
  ('unisex', 'S',  1, 86, 92, 71, 77, 91, 97, 78, 70, 'Unisex straight cut for men and women', 'قصة مستقيمة موحدة للجنسين'),
  ('unisex', 'M',  2, 94, 100, 79, 85, 99, 105, 79, 72, 'Unisex balanced fit with flexible mobility', 'قصة متوازنة مريحة للجنسين'),
  ('unisex', 'L',  3, 102, 108, 87, 93, 107, 113, 80, 74, 'Relaxed straight profile for clinical duty', 'قصة واسعة مستقيمة لأداء المهام الطبية'),
  ('unisex', 'XL', 4, 110, 117, 95, 102, 115, 122, 81, 75, 'Roomy comfort fit suitable for layering', 'قصة رحبة ملائمة للارتداء فوق الملابس'),
  ('unisex', '2XL', 5, 119, 126, 104, 111, 124, 131, 81, 76, 'Extended unisex cut for full range of motion', 'قصة موسعة لحرية حركة تامة')
on conflict (category, size, coalesce(product_id, 0)) do update set
  chest_min_cm = excluded.chest_min_cm,
  chest_max_cm = excluded.chest_max_cm,
  waist_min_cm = excluded.waist_min_cm,
  waist_max_cm = excluded.waist_max_cm,
  hip_min_cm = excluded.hip_min_cm,
  hip_max_cm = excluded.hip_max_cm,
  inseam_cm = excluded.inseam_cm,
  garment_length_cm = excluded.garment_length_cm,
  note_en = excluded.note_en,
  note_ar = excluded.note_ar,
  updated_at = now();
