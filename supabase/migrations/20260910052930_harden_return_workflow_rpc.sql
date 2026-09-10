alter table public.return_requests
  add constraint return_requests_resolution_lifecycle_check
    check (
      status not in ('approved', 'received', 'completed')
      or resolution is not null
    ) not valid,
  add constraint return_requests_refund_shape_check
    check (
      resolution = 'refund'
      or (
        refund_amount_minor = 0
        and refund_method is null
        and refund_reference is null
        and refund_completed_at is null
      )
    ) not valid,
  add constraint return_requests_completed_refund_check
    check (
      status <> 'completed'
      or resolution <> 'refund'
      or (
        refund_amount_minor > 0
        and refund_method is not null
        and refund_reference is not null
        and refund_completed_at is not null
      )
    ) not valid,
  add constraint return_requests_refund_completed_state_check
    check (
      refund_completed_at is null
      or (status = 'completed' and resolution = 'refund')
    ) not valid;

alter table public.return_requests
  validate constraint return_requests_resolution_lifecycle_check;
alter table public.return_requests
  validate constraint return_requests_refund_shape_check;
alter table public.return_requests
  validate constraint return_requests_completed_refund_check;
alter table public.return_requests
  validate constraint return_requests_refund_completed_state_check;

-- Keep the privileged implementation outside the exposed API schema. The
-- public function below is only a typed RPC facade; the private implementation
-- performs its own role checks and runs the multi-table transition atomically.
alter function public.admin_update_return(
  uuid,
  public.return_request_status,
  public.return_resolution,
  text,
  text,
  bigint,
  public.return_refund_method,
  text,
  jsonb
) set schema private;

alter function private.admin_update_return(
  uuid,
  public.return_request_status,
  public.return_resolution,
  text,
  text,
  bigint,
  public.return_refund_method,
  text,
  jsonb
) security definer;

revoke all on function private.admin_update_return(
  uuid,
  public.return_request_status,
  public.return_resolution,
  text,
  text,
  bigint,
  public.return_refund_method,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function private.admin_update_return(
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

create function public.admin_update_return(
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
language sql
security invoker
set search_path = ''
as $$
  select private.admin_update_return(
    p_return_id,
    p_status,
    p_resolution,
    p_customer_note,
    p_internal_note,
    p_refund_amount_minor,
    p_refund_method,
    p_refund_reference,
    p_item_receipts
  );
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

revoke update (
  status,
  resolution,
  staff_note,
  reviewed_at,
  received_at,
  completed_at,
  refund_amount_minor,
  refund_method,
  refund_reference,
  refund_completed_at
) on public.return_requests from authenticated;

revoke update (
  received_quantity,
  restocked_quantity
) on public.return_request_items from authenticated;

revoke insert (
  return_request_id,
  status,
  note,
  actor_id
) on public.return_status_history from authenticated;

revoke insert on public.return_internal_notes from authenticated;
revoke usage, select on sequence public.return_internal_notes_id_seq
  from authenticated;

drop policy if exists return_requests_staff_update
  on public.return_requests;
drop policy if exists return_request_items_staff_update
  on public.return_request_items;
drop policy if exists return_status_history_staff_insert
  on public.return_status_history;
drop policy if exists return_internal_notes_staff_insert
  on public.return_internal_notes;
