import http from "./http";

/**
 * Seller and admin dashboard calls.
 *
 * Every one of these is refused by the server for the wrong role. The frontend hides the
 * UI as a courtesy, not as a security measure - hiding a button has never stopped anyone.
 */

// --- seller -----------------------------------------------------------------

export const getSellerDashboard = async () => {
  const { data } = await http.get("/seller/dashboard");
  return data;
};

/** Advance one of my orders: shipped or delivered. */
export const setSellerOrderStatus = async (orderId, status, reason = "") => {
  const { data } = await http.patch(`/seller/orders/${encodeURIComponent(orderId)}/status`, {
    status,
    reason,
  });
  return data;
};

// --- admin ------------------------------------------------------------------

export const getAdminDashboard = async () => {
  const { data } = await http.get("/admin/dashboard");
  return data;
};

/** Approve or reject a seller application. decision is "approve" or "reject". */
export const reviewSeller = async (sellerId, decision, note = "") => {
  const { data } = await http.post(`/admin/sellers/${encodeURIComponent(sellerId)}/review`, {
    decision,
    note,
  });
  return data;
};

/** Hide or restore any listing. */
export const setProductVisibility = async (productId, active) => {
  const { data } = await http.patch(`/admin/products/${encodeURIComponent(productId)}/visibility`, null, {
    params: { active },
  });
  return data;
};

// --- health -----------------------------------------------------------------

/** Used to tell "the API is down" apart from "you are not allowed" before showing a page. */
export const checkHealth = async () => {
  const { data } = await http.get("/health");
  return data;
};
