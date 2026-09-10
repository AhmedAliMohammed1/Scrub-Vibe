create type public.product_review_status as enum ('pending', 'approved', 'rejected');

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_item_id bigint not null references public.order_items(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  title text check (title is null or char_length(title) between 3 and 100),
  body text not null check (char_length(body) between 20 and 1500),
  fit_feedback text check (fit_feedback is null or fit_feedback in ('runs_small', 'true_to_size', 'runs_large')),
  would_recommend boolean not null default true,
  reviewer_name text not null check (char_length(reviewer_name) between 1 and 80),
  reviewer_locale text not null default 'en' check (reviewer_locale in ('en', 'ar')),
  purchased_size text,
  purchased_colour text,
  is_verified_purchase boolean not null default true,
  status public.product_review_status not null default 'pending',
  is_featured boolean not null default false,
  admin_response text check (admin_response is null or char_length(admin_response) <= 1000),
  responded_by uuid references auth.users(id) on delete set null,
  responded_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id),
  unique (order_item_id),
  check ((status = 'approved') or not is_featured),
  check (
    (admin_response is null and responded_by is null and responded_at is null)
    or
    (admin_response is not null and responded_by is not null and responded_at is not null)
  ),
  check (
    (status = 'approved' and published_at is not null)
    or
    (status <> 'approved' and published_at is null)
  )
);

create table public.product_review_history (
  id bigint generated always as identity primary key,
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  from_status public.product_review_status,
  to_status public.product_review_status not null,
  action text not null check (action in ('submitted', 'edited', 'moderated')),
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 1000),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index product_reviews_product_published_idx
  on public.product_reviews (product_id, is_featured desc, published_at desc)
  where status = 'approved';
create index product_reviews_user_updated_idx
  on public.product_reviews (user_id, updated_at desc);
create index product_reviews_status_created_idx
  on public.product_reviews (status, created_at desc);
create index product_reviews_rating_idx
  on public.product_reviews (rating)
  where status = 'approved';
create index product_review_history_review_created_idx
  on public.product_review_history (review_id, created_at desc);
create index product_review_history_actor_idx
  on public.product_review_history (actor_id)
  where actor_id is not null;

alter table public.product_reviews enable row level security;
alter table public.product_review_history enable row level security;

revoke all on public.product_reviews, public.product_review_history from anon, authenticated;
grant select on public.product_reviews to anon, authenticated;
grant select on public.product_review_history to authenticated;

create policy product_reviews_public_approved_select
on public.product_reviews for select to anon, authenticated
using (status = 'approved');

create policy product_reviews_owner_select
on public.product_reviews for select to authenticated
using ((select auth.uid()) = user_id);

create policy product_reviews_staff_select
on public.product_reviews for select to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','analyst','support','admin','super_admin']::public.app_role[])));

create policy product_review_history_staff_select
on public.product_review_history for select to authenticated
using ((select private.has_any_role(array['content_editor','product_manager','support','admin','super_admin']::public.app_role[])));

create or replace function public.submit_product_review(
  p_order_item_id bigint,
  p_rating integer,
  p_title text,
  p_body text,
  p_fit_feedback text,
  p_would_recommend boolean,
  p_locale text
)
returns public.product_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_item_id bigint;
  v_product_id bigint;
  v_size text;
  v_colour_en text;
  v_colour_ar text;
  v_customer_name text;
  v_reviewer_name text;
  v_review public.product_reviews%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'REVIEW_AUTH_REQUIRED';
  end if;
  if p_rating not between 1 and 5 then
    raise exception using errcode = 'P0001', message = 'REVIEW_RATING_INVALID';
  end if;
  if char_length(trim(coalesce(p_body, ''))) not between 20 and 1500 then
    raise exception using errcode = 'P0001', message = 'REVIEW_BODY_INVALID';
  end if;
  if nullif(trim(coalesce(p_title, '')), '') is not null
     and char_length(trim(p_title)) not between 3 and 100 then
    raise exception using errcode = 'P0001', message = 'REVIEW_TITLE_INVALID';
  end if;
  if p_fit_feedback is not null
     and p_fit_feedback not in ('runs_small', 'true_to_size', 'runs_large') then
    raise exception using errcode = 'P0001', message = 'REVIEW_FIT_INVALID';
  end if;
  if p_locale not in ('en', 'ar') then
    raise exception using errcode = 'P0001', message = 'REVIEW_LOCALE_INVALID';
  end if;

  select oi.id, oi.product_id, oi.size, oi.colour_en, oi.colour_ar, o.customer_name
  into v_order_item_id, v_product_id, v_size, v_colour_en, v_colour_ar, v_customer_name
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.id = p_order_item_id
    and oi.product_id is not null
    and o.user_id = v_user_id
    and o.status in ('delivered', 'partially_returned', 'returned')
  for update of oi;

  if not found then
    raise exception using errcode = 'P0001', message = 'REVIEW_PURCHASE_REQUIRED';
  end if;

  v_reviewer_name := split_part(
    regexp_replace(trim(coalesce(v_customer_name, '')), '\s+', ' ', 'g'),
    ' ',
    1
  );
  if v_reviewer_name = '' then
    v_reviewer_name := case when p_locale = 'ar' then 'عميل موثّق' else 'Verified customer' end;
  end if;

  begin
    insert into public.product_reviews (
      product_id,
      user_id,
      order_item_id,
      rating,
      title,
      body,
      fit_feedback,
      would_recommend,
      reviewer_name,
      reviewer_locale,
      purchased_size,
      purchased_colour,
      is_verified_purchase,
      status
    ) values (
      v_product_id,
      v_user_id,
      v_order_item_id,
      p_rating,
      nullif(trim(coalesce(p_title, '')), ''),
      trim(p_body),
      p_fit_feedback,
      coalesce(p_would_recommend, true),
      v_reviewer_name,
      p_locale,
      nullif(trim(coalesce(v_size, '')), ''),
      nullif(trim(coalesce(case when p_locale = 'ar' then v_colour_ar else v_colour_en end, '')), ''),
      true,
      'pending'
    )
    returning * into v_review;
  exception
    when unique_violation then
      raise exception using errcode = 'P0001', message = 'REVIEW_ALREADY_EXISTS';
  end;

  insert into public.product_review_history (
    review_id, from_status, to_status, action, actor_id
  ) values (
    v_review.id, null, 'pending', 'submitted', v_user_id
  );

  return v_review;
end;
$$;

create or replace function public.update_product_review(
  p_review_id uuid,
  p_rating integer,
  p_title text,
  p_body text,
  p_fit_feedback text,
  p_would_recommend boolean,
  p_locale text
)
returns public.product_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_previous public.product_reviews%rowtype;
  v_review public.product_reviews%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'REVIEW_AUTH_REQUIRED';
  end if;
  if p_rating not between 1 and 5 then
    raise exception using errcode = 'P0001', message = 'REVIEW_RATING_INVALID';
  end if;
  if char_length(trim(coalesce(p_body, ''))) not between 20 and 1500 then
    raise exception using errcode = 'P0001', message = 'REVIEW_BODY_INVALID';
  end if;
  if nullif(trim(coalesce(p_title, '')), '') is not null
     and char_length(trim(p_title)) not between 3 and 100 then
    raise exception using errcode = 'P0001', message = 'REVIEW_TITLE_INVALID';
  end if;
  if p_fit_feedback is not null
     and p_fit_feedback not in ('runs_small', 'true_to_size', 'runs_large') then
    raise exception using errcode = 'P0001', message = 'REVIEW_FIT_INVALID';
  end if;
  if p_locale not in ('en', 'ar') then
    raise exception using errcode = 'P0001', message = 'REVIEW_LOCALE_INVALID';
  end if;

  select * into v_previous
  from public.product_reviews
  where id = p_review_id and user_id = v_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'REVIEW_NOT_FOUND';
  end if;

  update public.product_reviews
  set rating = p_rating,
      title = nullif(trim(coalesce(p_title, '')), ''),
      body = trim(p_body),
      fit_feedback = p_fit_feedback,
      would_recommend = coalesce(p_would_recommend, true),
      reviewer_locale = p_locale,
      status = 'pending',
      is_featured = false,
      admin_response = null,
      responded_by = null,
      responded_at = null,
      published_at = null,
      updated_at = now()
  where id = p_review_id
  returning * into v_review;

  insert into public.product_review_history (
    review_id, from_status, to_status, action, actor_id
  ) values (
    v_review.id, v_previous.status, 'pending', 'edited', v_user_id
  );

  return v_review;
end;
$$;

create or replace function public.delete_product_review(p_review_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'REVIEW_AUTH_REQUIRED';
  end if;

  delete from public.product_reviews
  where id = p_review_id and user_id = v_user_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'REVIEW_NOT_FOUND';
  end if;
end;
$$;

create or replace function public.admin_moderate_product_review(
  p_review_id uuid,
  p_status public.product_review_status,
  p_is_featured boolean,
  p_admin_response text,
  p_moderation_note text
)
returns public.product_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_previous public.product_reviews%rowtype;
  v_review public.product_reviews%rowtype;
  v_response text := nullif(trim(coalesce(p_admin_response, '')), '');
  v_note text := nullif(trim(coalesce(p_moderation_note, '')), '');
begin
  if v_actor_id is null or not private.has_any_role(array['content_editor','product_manager','admin','super_admin']::public.app_role[]) then
    raise exception using errcode = 'P0001', message = 'REVIEW_MODERATION_FORBIDDEN';
  end if;
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception using errcode = 'P0001', message = 'REVIEW_STATUS_INVALID';
  end if;
  if v_response is not null and char_length(v_response) > 1000 then
    raise exception using errcode = 'P0001', message = 'REVIEW_RESPONSE_INVALID';
  end if;
  if v_note is not null and char_length(v_note) > 1000 then
    raise exception using errcode = 'P0001', message = 'REVIEW_NOTE_INVALID';
  end if;

  select * into v_previous
  from public.product_reviews
  where id = p_review_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'REVIEW_NOT_FOUND';
  end if;

  update public.product_reviews
  set status = p_status,
      is_featured = case when p_status = 'approved' then coalesce(p_is_featured, false) else false end,
      admin_response = v_response,
      responded_by = case when v_response is not null then v_actor_id else null end,
      responded_at = case when v_response is not null then now() else null end,
      published_at = case
        when p_status = 'approved' then coalesce(v_previous.published_at, now())
        else null
      end,
      updated_at = now()
  where id = p_review_id
  returning * into v_review;

  insert into public.product_review_history (
    review_id, from_status, to_status, action, moderation_note, actor_id
  ) values (
    v_review.id, v_previous.status, p_status, 'moderated', v_note, v_actor_id
  );

  return v_review;
end;
$$;

revoke execute on function public.submit_product_review(bigint, integer, text, text, text, boolean, text) from public, anon;
revoke execute on function public.update_product_review(uuid, integer, text, text, text, boolean, text) from public, anon;
revoke execute on function public.delete_product_review(uuid) from public, anon;
revoke execute on function public.admin_moderate_product_review(uuid, public.product_review_status, boolean, text, text) from public, anon;

grant execute on function public.submit_product_review(bigint, integer, text, text, text, boolean, text) to authenticated;
grant execute on function public.update_product_review(uuid, integer, text, text, text, boolean, text) to authenticated;
grant execute on function public.delete_product_review(uuid) to authenticated;
grant execute on function public.admin_moderate_product_review(uuid, public.product_review_status, boolean, text, text) to authenticated;

grant usage, select on sequence public.product_review_history_id_seq to authenticated;
