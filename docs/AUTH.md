# Authentication and authorization

Supabase Auth will provide PKCE cookie sessions through `@supabase/ssr`. Route visibility is not authorization: every sensitive mutation and read validates the user and required permission on the server. Administrative roles are customer, support, warehouse, content editor, product manager, analyst, admin and super admin.
