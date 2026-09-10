create type public.return_refund_method as enum (
  'original_payment',
  'vodafone_cash',
  'instapay',
  'bank_transfer',
  'cash'
);

alter table public.return_requests
  add column refund_amount_minor bigint not null default 0,
  add column refund_method public.return_refund_method,
  add column refund_reference text,
  add column refund_completed_at timestamptz,
  add constraint return_requests_refund_amount_check
    check (refund_amount_minor between 0 and 100000000),
  add constraint return_requests_refund_reference_check
    check (
      refund_reference is null
      or char_length(refund_reference) between 2 and 160
    );

alter table public.return_request_items
  add column received_quantity integer not null default 0,
  add column restocked_quantity integer not null default 0,
  add constraint return_request_items_received_quantity_check
    check (received_quantity between 0 and quantity),
  add constraint return_request_items_restocked_quantity_check
    check (restocked_quantity between 0 and received_quantity);

create table public.return_internal_notes (
  id bigint generated always as identity primary key,
  return_request_id uuid not null
    references public.return_requests(id) on delete cascade,
  note text not null check (char_length(note) between 1 and 2000),
  actor_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index return_internal_notes_request_created_idx
  on public.return_internal_notes(return_request_id, created_at desc);
create index return_internal_notes_actor_idx
  on public.return_internal_notes(actor_id);

alter table public.return_internal_notes enable row level security;
revoke all on public.return_internal_notes from anon, authenticated;
grant select, insert on public.return_internal_notes to authenticated;
grant usage, select on sequence public.return_internal_notes_id_seq
  to authenticated;

create policy return_internal_notes_staff_select
on public.return_internal_notes
for select
to authenticated
using (
  (select private.has_any_role(
    array['support','warehouse','admin','super_admin']::public.app_role[]
  ))
);

create policy return_internal_notes_staff_insert
on public.return_internal_notes
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and (select private.has_any_role(
    array['support','warehouse','admin','super_admin']::public.app_role[]
  ))
);

grant update (
  refund_amount_minor,
  refund_method,
  refund_reference,
  refund_completed_at
) on public.return_requests to authenticated;

grant update (
  received_quantity,
  restocked_quantity
) on public.return_request_items to authenticated;

create policy return_request_items_staff_update
on public.return_request_items
for update
to authenticated
using (
  (select private.has_any_role(
    array['support','warehouse','admin','super_admin']::public.app_role[]
  ))
)
with check (
  (select private.has_any_role(
    array['support','warehouse','admin','super_admin']::public.app_role[]
  ))
);

create or replace function private.enforce_returned_order_terminal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('partially_returned', 'returned')
    and new.status <> old.status then
    raise exception 'TERMINAL_ORDER' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger orders_returned_status_terminal
before update of status on public.orders
for each row execute function private.enforce_returned_order_terminal();

create or replace function public.admin_update_return(
  p_return_id uuid,
  p_status public.return_request_status,
  p_resolution public.return_resolution default null,
  p_customer_note text default null,
  p_internal_note text default null,
  p_refund_amount_minor bigint default 0,
  p_refund_method public.return_refund_method default null,
  p_refund_reference text default null,
  p_item_receipts jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_return public.return_requests%rowtype;
  v_order public.orders%rowtype;
  v_item public.return_request_items%rowtype;
  v_line jsonb;
  v_variant_id bigint;
  v_new_received integer;
  v_new_restocked integer;
  v_restock_delta integer;
  v_received_quantity integer;
  v_order_quantity integer;
  v_received_value_minor bigint;
  v_max_refund_minor bigint;
  v_is_full_return boolean;
  v_order_status public.order_status;
  v_payment_status public.payment_status;
  v_history_note text;
begin
  if v_actor is null or not (select private.has_any_role(
    array['support','warehouse','admin','super_admin']::public.app_role[]
  )) then
    raise exception 'RETURN_UPDATE_FORBIDDEN' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_customer_note, ''))) > 1000
    or char_length(trim(coalesce(p_internal_note, ''))) > 2000 then
    raise exception 'RETURN_NOTE_TOO_LONG' using errcode = '22023';
  end if;

  select * into v_return
  from public.return_requests
  where id = p_return_id
  for update;

  if not found then
    raise exception 'RETURN_NOT_FOUND' using errcode = 'P0002';
  end if;

  select * into v_order
  from public.orders
  where id = v_return.order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_status <> v_return.status then
    if v_return.status = 'requested'
      and p_status::text not in ('reviewing', 'approved', 'rejected', 'cancelled') then
      raise exception 'INVALID_RETURN_TRANSITION' using errcode = 'P0001';
    elsif v_return.status = 'reviewing'
      and p_status::text not in ('approved', 'rejected', 'cancelled') then
      raise exception 'INVALID_RETURN_TRANSITION' using errcode = 'P0001';
    elsif v_return.status = 'approved'
      and p_status::text not in ('received', 'cancelled') then
      raise exception 'INVALID_RETURN_TRANSITION' using errcode = 'P0001';
    elsif v_return.status = 'received'
      and p_status <> 'completed' then
      raise exception 'INVALID_RETURN_TRANSITION' using errcode = 'P0001';
    elsif v_return.status in ('rejected', 'completed', 'cancelled') then
      raise exception 'TERMINAL_RETURN' using errcode = 'P0001';
    end if;
  end if;

  if v_return.status = 'completed'
    and (
      p_resolution is distinct from v_return.resolution
      or p_refund_amount_minor is distinct from v_return.refund_amount_minor
      or p_refund_method is distinct from v_return.refund_method
      or nullif(trim(p_refund_reference), '')
        is distinct from v_return.refund_reference
    ) then
    raise exception 'COMPLETED_RETURN_FINANCIALS_LOCKED' using errcode = 'P0001';
  end if;

  if p_status in ('approved', 'rejected')
    and not (select private.has_any_role(
      array['support','admin','super_admin']::public.app_role[]
    )) then
    raise exception 'RETURN_REVIEW_FORBIDDEN' using errcode = '42501';
  end if;

  if p_status = 'received'
    and not (select private.has_any_role(
      array['warehouse','admin','super_admin']::public.app_role[]
    )) then
    raise exception 'RETURN_RECEIPT_FORBIDDEN' using errcode = '42501';
  end if;

  if p_status = 'completed'
    and not (select private.has_any_role(
      array['admin','super_admin']::public.app_role[]
    )) then
    raise exception 'RETURN_COMPLETION_FORBIDDEN' using errcode = '42501';
  end if;

  if p_status in ('approved', 'received', 'completed') and p_resolution is null then
    raise exception 'RETURN_RESOLUTION_REQUIRED' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_item_receipts, '[]'::jsonb)) <> 'array' then
    raise exception 'INVALID_RETURN_ITEMS' using errcode = '22023';
  end if;

  if v_return.status = 'completed' and jsonb_array_length(p_item_receipts) > 0 then
    raise exception 'COMPLETED_RETURN_ITEMS_LOCKED' using errcode = 'P0001';
  end if;

  for v_line in
    select value from jsonb_array_elements(coalesce(p_item_receipts, '[]'::jsonb))
  loop
    begin
      v_new_received := (v_line ->> 'received_quantity')::integer;
      v_new_restocked := (v_line ->> 'restocked_quantity')::integer;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'INVALID_RETURN_ITEM_QUANTITIES' using errcode = '22023';
    end;

    select * into v_item
    from public.return_request_items
    where id = (v_line ->> 'id')::bigint
      and return_request_id = p_return_id
    for update;

    if not found then
      raise exception 'RETURN_ITEM_NOT_FOUND' using errcode = 'P0002';
    end if;

    if v_new_received < 0 or v_new_received > v_item.quantity
      or v_new_restocked < 0 or v_new_restocked > v_new_received then
      raise exception 'INVALID_RETURN_ITEM_QUANTITIES' using errcode = '22023';
    end if;

    if v_new_restocked < v_item.restocked_quantity then
      raise exception 'RESTOCK_CANNOT_BE_REVERSED' using errcode = 'P0001';
    end if;

    v_restock_delta := v_new_restocked - v_item.restocked_quantity;

    update public.return_request_items
    set received_quantity = v_new_received,
        restocked_quantity = v_new_restocked
    where id = v_item.id;

    if v_restock_delta > 0 then
      if p_status not in ('received', 'completed')
        or not (select private.has_any_role(
          array['warehouse','admin','super_admin']::public.app_role[]
        )) then
        raise exception 'RETURN_RESTOCK_FORBIDDEN' using errcode = '42501';
      end if;

      select variant_id into v_variant_id
      from public.order_items
      where id = v_item.order_item_id;

      if v_variant_id is null then
        raise exception 'RETURN_ITEM_HAS_NO_VARIANT' using errcode = 'P0001';
      end if;

      update public.inventory
      set on_hand = on_hand + v_restock_delta,
          updated_at = now()
      where variant_id = v_variant_id;

      if not found then
        raise exception 'INVENTORY_NOT_FOUND' using errcode = 'P0002';
      end if;

      insert into public.inventory_movements (
        variant_id,
        movement_type,
        quantity_delta,
        reference_type,
        reference_id,
        reason,
        actor_id
      ) values (
        v_variant_id,
        'return',
        v_restock_delta,
        'return',
        p_return_id::text,
        'Sellable return received',
        v_actor
      );
    end if;
  end loop;

  select
    coalesce(sum(ri.received_quantity), 0)::integer,
    coalesce(sum(ri.received_quantity::bigint * oi.unit_price_minor), 0)::bigint
  into v_received_quantity, v_received_value_minor
  from public.return_request_items ri
  join public.order_items oi on oi.id = ri.order_item_id
  where ri.return_request_id = p_return_id;

  select coalesce(sum(quantity), 0)::integer
  into v_order_quantity
  from public.order_items
  where order_id = v_order.id;

  v_is_full_return := v_received_quantity = v_order_quantity;
  v_max_refund_minor := case
    when v_is_full_return then v_order.total_minor
    else v_received_value_minor
  end;

  if p_status in ('received', 'completed') and v_received_quantity = 0 then
    raise exception 'RECEIVED_QUANTITY_REQUIRED' using errcode = '22023';
  end if;

  if p_resolution <> 'refund' then
    p_refund_amount_minor := 0;
    p_refund_method := null;
    p_refund_reference := null;
  elsif p_refund_amount_minor < 0 or p_refund_amount_minor > v_max_refund_minor then
    raise exception 'INVALID_REFUND_AMOUNT' using errcode = '22023';
  end if;

  if p_status = 'completed' and p_resolution = 'refund' then
    if p_refund_amount_minor <= 0 then
      raise exception 'REFUND_AMOUNT_REQUIRED' using errcode = '22023';
    end if;
    if p_refund_method is null then
      raise exception 'REFUND_METHOD_REQUIRED' using errcode = '22023';
    end if;
    if char_length(trim(coalesce(p_refund_reference, ''))) < 2 then
      raise exception 'REFUND_REFERENCE_REQUIRED' using errcode = '22023';
    end if;
    if v_order.payment_status not in ('paid', 'cod_collected', 'partially_refunded') then
      raise exception 'ORDER_PAYMENT_NOT_REFUNDABLE' using errcode = 'P0001';
    end if;
  end if;

  update public.return_requests
  set status = p_status,
      resolution = p_resolution,
      staff_note = nullif(trim(p_customer_note), ''),
      refund_amount_minor = p_refund_amount_minor,
      refund_method = p_refund_method,
      refund_reference = nullif(trim(p_refund_reference), ''),
      reviewed_at = case
        when p_status in ('approved', 'rejected') then coalesce(reviewed_at, now())
        else reviewed_at
      end,
      received_at = case
        when p_status in ('received', 'completed') then coalesce(received_at, now())
        else received_at
      end,
      completed_at = case
        when p_status = 'completed' then coalesce(completed_at, now())
        else completed_at
      end,
      refund_completed_at = case
        when p_status = 'completed' and p_resolution = 'refund'
          then coalesce(refund_completed_at, now())
        else refund_completed_at
      end
  where id = p_return_id;

  insert into public.return_status_history (
    return_request_id,
    status,
    note,
    actor_id
  ) values (
    p_return_id,
    p_status,
    nullif(trim(p_customer_note), ''),
    v_actor
  );

  if nullif(trim(p_internal_note), '') is not null then
    insert into public.return_internal_notes (
      return_request_id,
      note,
      actor_id
    ) values (
      p_return_id,
      trim(p_internal_note),
      v_actor
    );
  end if;

  v_order_status := case
    when v_is_full_return then 'returned'::public.order_status
    else 'partially_returned'::public.order_status
  end;
  v_payment_status := v_order.payment_status;

  if p_status = 'completed' and v_return.status <> 'completed' then
    if p_resolution = 'refund' then
      v_payment_status := case
        when p_refund_amount_minor >= v_order.total_minor
          then 'refunded'::public.payment_status
        else 'partially_refunded'::public.payment_status
      end;
    end if;

    v_history_note := left(
      concat(
        'Return ', v_return.return_number, ' completed · ',
        replace(p_resolution::text, '_', ' '),
        case
          when p_resolution = 'refund'
            then concat(' · EGP ', to_char(p_refund_amount_minor / 100.0, 'FM999999990.00'))
          else ''
        end
      ),
      500
    );

    perform public.admin_update_order(
      v_order.id,
      v_order_status,
      v_payment_status,
      v_history_note,
      v_order.shipment_number,
      v_order.courier,
      v_order.tracking_url,
      null
    );
  end if;

  return jsonb_build_object(
    'return_status', p_status,
    'resolution', p_resolution,
    'received_quantity', v_received_quantity,
    'full_return', v_is_full_return,
    'maximum_refund_minor', v_max_refund_minor,
    'order_status', case when p_status = 'completed' then v_order_status else v_order.status end,
    'payment_status', case when p_status = 'completed' then v_payment_status else v_order.payment_status end
  );
end;
$$;

revoke execute on function public.admin_update_return(
  uuid,
  public.return_request_status,
  public.return_resolution,
  text,
  text,
  bigint,
  public.return_refund_method,
  text,
  jsonb
) from public, anon;

grant execute on function public.admin_update_return(
  uuid,
  public.return_request_status,
  public.return_resolution,
  text,
  text,
  bigint,
  public.return_refund_method,
  text,
  jsonb
) to authenticated;
