# Administration

The main dashboard at `/en/admin` covers catalogue, inventory and marketing analytics. Order operations are at `/en/admin/orders` and are available to support, warehouse, admin and super-admin roles according to their database policies.

The order dashboard provides collected revenue, paid average-order value, proof-review queue and fulfilment queue. Staff can:

- inspect immutable product, price, colour, size and address snapshots;
- open short-lived signed links for private payment proofs;
- approve or reject transfer proofs;
- update order and payment status with a customer-facing note;
- add a courier, shipment number and courier tracking URL;
- progress an order through confirmed, preparing, ready, shipped, out for delivery and delivered;
- cancel an undelivered order and release its inventory reservation.

Marking an order delivered converts its reservation into a sale and deducts on-hand stock atomically. Shipment numbers are required for shipped and out-for-delivery states. Cancelled and returned orders are treated as terminal states.

For manual transfers, approve the screenshot and set payment to `paid` before changing the order to `confirmed`. For COD, use `cod_due` until delivery and `cod_collected` once cash is received.
