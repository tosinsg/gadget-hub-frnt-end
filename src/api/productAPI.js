import http from "./http";

/**
 * Catalogue calls.
 *
 * The server returns one consistent shape, so there is no longer a "normalise whatever the
 * backend happened to send" layer. The previous version of this project carried a
 * `normalize.js` that accepted `_id` OR `id`, `image` OR `image_url`, `stock` OR
 * `stock_quantity` - defensive code for a mismatch that no longer exists, and a source of
 * silent bugs (a typo in a field name became a silent `undefined` instead of an error).
 */

/** Browse the catalogue. Returns { products, page, limit, totalPages, totalProducts }. */
export const getProducts = async (params = {}) => {
  // Drop empty filters so the query string stays clean and the server sees its defaults.
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null)
  );
  const { data } = await http.get("/products", { params: query });
  return {
    products: data.products ?? [],
    page: Number(data.page ?? 1),
    limit: Number(data.limit ?? 20),
    totalPages: Number(data.totalPages ?? 1),
    totalProducts: Number(data.totalProducts ?? 0),
  };
};

export const getProductById = async (id) => {
  const { data } = await http.get(`/products/${encodeURIComponent(id)}`);
  return data;
};

export const getRelatedProducts = async (id, limit = 4) => {
  const { data } = await http.get(`/products/${encodeURIComponent(id)}/related`, { params: { limit } });
  return data;
};

export const getCategories = async () => {
  const { data } = await http.get("/products/categories/list");
  return data;
};

/** Create a listing. Approved sellers and admins only; the server rejects anyone else. */
export const createProduct = async (payload) => {
  const { data } = await http.post("/products", payload);
  return data;
};

/** Partial update of one's own listing. */
export const updateProduct = async (id, payload) => {
  const { data } = await http.patch(`/products/${encodeURIComponent(id)}`, payload);
  return data;
};

/** Delete a listing with no sales history, or hide it if it has been ordered. */
export const deleteProduct = async (id) => {
  await http.delete(`/products/${encodeURIComponent(id)}`);
};
