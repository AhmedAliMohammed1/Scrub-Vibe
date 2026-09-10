-- PostgreSQL requires newly-added enum values to be committed before they can
-- be used by functions or data changes. Keep these values in their own
-- migration so the workflow migration that follows can use them safely.
alter type public.order_status
  add value if not exists 'partially_returned' after 'delivered';

alter type public.payment_status
  add value if not exists 'partially_refunded' after 'paid';
