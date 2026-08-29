# Authentication and authorization

Supabase Auth will provide PKCE cookie sessions through `@supabase/ssr`. Route visibility is not authorization: every sensitive mutation and read validates the user and required permission on the server. Administrative roles are customer, support, warehouse, content editor, product manager, analyst, admin and super admin.

## Implemented boundary

- Browser and server clients use the publishable key only.
- Next.js 16 `proxy.ts` verifies claims early, refreshes cookies and applies the no-cache headers supplied by `@supabase/ssr`.
- Server Components tolerate cookie writes being unavailable; Proxy owns refreshes.
- `requireUser` verifies JWT claims and `requireRoles` loads server-controlled role rows under RLS.
- Missing local credentials leave the public development storefront operational; protected operations fail with a configuration error rather than silently weakening authorization.
