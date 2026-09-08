-- Customer saved delivery addresses schema with owner-scoped RLS and automatic default management

create table if not exists public.customer_addresses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'clinic' check (label in ('clinic', 'home', 'work', 'other')),
  custom_label text check (custom_label is null or char_length(custom_label) <= 50),
  recipient_name text not null check (char_length(recipient_name) between 2 and 120),
  phone text not null check (phone ~ '^\+20(10|11|12|15)[0-9]{8}$' or phone ~ '^0(10|11|12|15)[0-9]{8}$'),
  governorate_code text not null references public.shipping_governorates(code) on delete restrict,
  city_code text not null check (char_length(city_code) between 2 and 80),
  city text not null check (char_length(city) between 2 and 100),
  street_address text not null check (char_length(street_address) between 5 and 300),
  building text check (building is null or char_length(building) <= 50),
  floor text check (floor is null or char_length(floor) <= 30),
  apartment text check (apartment is null or char_length(apartment) <= 50),
  landmark text check (landmark is null or char_length(landmark) <= 200),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_user_idx
  on public.customer_addresses (user_id, created_at desc);

create index if not exists customer_addresses_governorate_idx
  on public.customer_addresses (governorate_code);

-- Single default address trigger: when an address is marked default or first created
create or replace function public.handle_customer_address_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.customer_addresses where user_id = new.user_id) then
      new.is_default := true;
    elsif new.is_default then
      update public.customer_addresses
      set is_default = false
      where user_id = new.user_id;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if new.is_default and not old.is_default then
      update public.customer_addresses
      set is_default = false
      where user_id = new.user_id and id <> new.id;
    end if;
    new.updated_at := now();
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_customer_address_defaults on public.customer_addresses;
create trigger trg_customer_address_defaults
before insert or update on public.customer_addresses
for each row
execute function public.handle_customer_address_defaults();

-- When default address is deleted, designate the most recently created remaining address as default
create or replace function public.handle_customer_address_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_default then
    update public.customer_addresses
    set is_default = true
    where id = (
      select id from public.customer_addresses
      where user_id = old.user_id
      order by created_at desc
      limit 1
    );
  end if;
  return old;
end;
$$;

drop trigger if exists trg_customer_address_delete on public.customer_addresses;
create trigger trg_customer_address_delete
after delete on public.customer_addresses
for each row
execute function public.handle_customer_address_delete();

-- Row Level Security
alter table public.customer_addresses enable row level security;

revoke all on public.customer_addresses from anon, authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;

drop policy if exists customer_addresses_owner_select on public.customer_addresses;
create policy customer_addresses_owner_select
on public.customer_addresses for select to authenticated
using (
  auth.uid() = user_id
  or (select private.has_any_role(array['admin','super_admin']::public.app_role[]))
);

drop policy if exists customer_addresses_owner_insert on public.customer_addresses;
create policy customer_addresses_owner_insert
on public.customer_addresses for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists customer_addresses_owner_update on public.customer_addresses;
create policy customer_addresses_owner_update
on public.customer_addresses for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists customer_addresses_owner_delete on public.customer_addresses;
create policy customer_addresses_owner_delete
on public.customer_addresses for delete to authenticated
using (auth.uid() = user_id);
