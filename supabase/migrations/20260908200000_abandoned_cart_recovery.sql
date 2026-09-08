-- Automated Abandoned-Cart Recovery: tracking table, profile opt-out, and RLS
-- Supports 3-stage timed recovery email escalation, recovery discount codes,
-- and conversion attribution.

-- 1. Add opt-out column to profiles table
alter table public.profiles
  add column if not exists cart_recovery_opt_out boolean not null default false;

-- 2. Create abandoned_cart_notifications table
create table if not exists public.abandoned_cart_notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stage text not null check (stage in ('first_reminder', 'second_reminder', 'discount_offer')),
  email_sent_to text not null check (char_length(email_sent_to) between 3 and 254),
  cart_value_minor bigint not null check (cart_value_minor >= 0),
  cart_item_count integer not null check (cart_item_count >= 1),
  cart_snapshot jsonb not null default '[]'::jsonb,
  recovery_discount_code text,
  recovered_at timestamptz,
  recovered_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Indexes for candidate selection and reporting
create index if not exists abandoned_cart_user_stage_idx
  on public.abandoned_cart_notifications (user_id, stage, created_at desc);

create index if not exists abandoned_cart_recovered_idx
  on public.abandoned_cart_notifications (recovered_at)
  where recovered_at is not null;

create index if not exists abandoned_cart_stage_created_idx
  on public.abandoned_cart_notifications (stage, created_at desc);

-- 4. Row Level Security
alter table public.abandoned_cart_notifications enable row level security;

revoke all on public.abandoned_cart_notifications from anon, authenticated;
grant select on public.abandoned_cart_notifications to authenticated;
grant usage, select on sequence public.abandoned_cart_notifications_id_seq to authenticated;

-- Staff read policy: support, analysts, admins, super_admins can view notifications & metrics
drop policy if exists abandoned_cart_notifications_staff_select on public.abandoned_cart_notifications;
create policy abandoned_cart_notifications_staff_select
on public.abandoned_cart_notifications for select to authenticated
using ((select private.has_any_role(array['analyst','support','admin','super_admin']::public.app_role[])));
