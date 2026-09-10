-- Migration: Drop old overloaded functions to eliminate ambiguity in PostgREST

drop function if exists public.admin_update_product(bigint, text, text, text, bigint, bigint, text, text[], public.product_status, text, text, bigint, bigint, bigint, text, text, jsonb, text);

drop function if exists public.admin_create_product_with_colours(text, text, text, bigint, bigint, text, text[], integer, integer, public.product_status, text, text, bigint, bigint, text, text, jsonb, text);
