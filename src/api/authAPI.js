import http from "./http";

/**
 * Authentication calls.
 *
 * The role is decided by WHICH ENDPOINT is called, never by a field in the body - the
 * server ignores any `role` sent to `/auth/signup` and always creates a buyer. Keeping the
 * role out of the payload here mirrors that, so there is no illusion of control.
 */

/** Create a buyer account. Returns { token, expiresAt, user }. */
export const signupBuyer = async ({ name, email, password }) => {
  const { data } = await http.post("/auth/signup", { name, email, password });
  return data;
};

/** Apply for a seller account. The account starts PENDING until an admin approves it. */
export const signupSeller = async ({ name, email, password, storeName, storePhone, storeCity, storeCategory }) => {
  const { data } = await http.post("/auth/seller/signup", {
    name,
    email,
    password,
    storeName,
    storePhone,
    storeCity,
    storeCategory,
  });
  return data;
};

/** Buyer login. */
export const loginBuyer = async ({ email, password }) => {
  const { data } = await http.post("/auth/login", { email, password });
  return data;
};

/** Seller login. */
export const loginSeller = async ({ email, password }) => {
  const { data } = await http.post("/auth/seller/login", { email, password });
  return data;
};

/**
 * Who am I?
 *
 * Called on app load to re-check the stored session against the server. This matters
 * because the stored user object can be out of date: a seller whose application was just
 * rejected still holds a token and a cached "seller" label until this call corrects it.
 */
export const fetchSession = async () => {
  const { data } = await http.get("/auth/me");
  return data;
};
