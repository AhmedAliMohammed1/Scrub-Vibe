-- The staff review action uses the authenticated user's Supabase client, so
-- Postgres privileges and RLS must both authorize the write. Keep the grants
-- column-scoped; RLS then limits the rows to approved staff roles.
grant update (
  status,
  resolution,
  staff_note,
  reviewed_at,
  received_at,
  completed_at
) on public.return_requests to authenticated;

drop policy if exists return_requests_staff_update on public.return_requests;
create policy return_requests_staff_update
on public.return_requests
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

grant insert (
  return_request_id,
  status,
  note,
  actor_id
) on public.return_status_history to authenticated;

drop policy if exists return_status_history_staff_insert on public.return_status_history;
create policy return_status_history_staff_insert
on public.return_status_history
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and (select private.has_any_role(
    array['support','warehouse','admin','super_admin']::public.app_role[]
  ))
);
