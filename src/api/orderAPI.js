import http from "./http";

/**
 * Order calls.
 *
 * Only product ids and quantities are sent. Prices and totals are computed by the server
 * from the database, so editing this request in devtools cannot change what is charged -
 * which is the point, and the reason no price field appears below.
 */

/** Place an order. `actor` may be null for guest checkout. */
export const createOrder = async ({ items, delivery }) => {
  const { data } = await http.post("/orders", {
    items: items.map((item) => ({
      productId: String(item.id),
      quantity: Number(item.quantity),
    })),
    delivery: {
      recipientName: delivery.recipientName.trim(),
      email: delivery.email.trim(),
      phone: delivery.phone.trim(),
      addressLine: delivery.addressLine.trim(),
      city: delivery.city.trim(),
      state: delivery.state.trim(),
    },
  });
  return data;
};

/** Orders belonging to the signed-in buyer. */
export const getMyOrders = async () => {
  const { data } = await http.get("/orders/mine");
  return data;
};

export const getOrderById = async (id) => {
  const { data } = await http.get(`/orders/${encodeURIComponent(id)}`);
  return data;
};

/** Cancel an order. Only allowed while it is still PLACED - the server enforces that. */
export const cancelOrder = async (id, reason = "") => {
  const { data } = await http.post(`/orders/${encodeURIComponent(id)}/cancel`, { reason });
  return data;
};
