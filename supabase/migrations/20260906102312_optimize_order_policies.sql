create index order_items_variant_idx on public.order_items (variant_id)
where variant_id is not null;
create index order_status_history_actor_idx on public.order_status_history (actor_id)
where actor_id is not null;
create index payment_proofs_submitter_idx on public.payment_proofs (submitted_by)
where submitted_by is not null;
create index payment_proofs_reviewer_idx on public.payment_proofs (reviewer_id)
where reviewer_id is not null;

drop policy orders_customer_select on public.orders;
drop policy orders_staff_select on public.orders;
create policy orders_authorized_select on public.orders for select to authenticated
using (
  (select auth.uid()) = user_id or
  (select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[]))
);

drop policy order_items_customer_select on public.order_items;
drop policy order_items_staff_select on public.order_items;
create policy order_items_authorized_select on public.order_items for select to authenticated
using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())) or
  (select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[]))
);

drop policy order_history_customer_select on public.order_status_history;
drop policy order_history_staff_select on public.order_status_history;
create policy order_history_authorized_select on public.order_status_history for select to authenticated
using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())) or
  (select private.has_any_role(array['support','warehouse','analyst','admin','super_admin']::public.app_role[]))
);

drop policy payment_proofs_customer_select on public.payment_proofs;
drop policy payment_proofs_staff_select on public.payment_proofs;
create policy payment_proofs_authorized_select on public.payment_proofs for select to authenticated
using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())) or
  (select private.has_any_role(array['support','admin','super_admin']::public.app_role[]))
);

create or replace function public.release_expired_order_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_line record;
  v_released integer := 0;
begin
  for v_order in
    select id from public.orders
    where reservation_expires_at <= now()
      and status in ('awaiting_payment', 'payment_review')
      and payment_status not in ('paid', 'cod_collected')
    for update skip locked
  loop
    for v_line in
      select variant_id, quantity from public.order_items
      where order_id = v_order.id and variant_id is not null
    loop
      update public.inventory
      set reserved = greatest(0, reserved - v_line.quantity), updated_at = now()
      where variant_id = v_line.variant_id;
      insert into public.inventory_movements (
        variant_id, movement_type, quantity_delta, reference_type, reference_id, reason
      ) values (
        v_line.variant_id, 'release', -v_line.quantity, 'order', v_order.id::text,
        'Expired checkout reservation'
      );
    end loop;
    update public.orders set
      status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = v_order.id;
    insert into public.order_status_history (order_id, status, payment_status, note)
    select id, 'cancelled', payment_status, 'Payment window expired' from public.orders where id = v_order.id;
    v_released := v_released + 1;
  end loop;
  return v_released;
end;
$$;
revoke execute on function public.release_expired_order_reservations() from public, anon, authenticated;
grant execute on function public.release_expired_order_reservations() to service_role;
