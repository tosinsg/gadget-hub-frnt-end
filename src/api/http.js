import axios from "axios";
import { API_URL } from "../config";

/**
 * The single HTTP client.
 *
 * Responsibilities:
 *  - attaches the bearer token to every request
 *  - turns any failure into a predictable Error with a human message and the HTTP status,
 *    so no component has to reach into `err.response.data` and guess the shape
 *  - clears the stored session when the server says the token is no longer valid, so a
 *    stale token cannot leave the UI in a half-logged-in state
 */
const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/** Set by AuthContext so this module can react to a rejected token without importing React. */
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const TOKEN_KEY = "gadgethub_token";
export const USER_KEY = "gadgethub_user";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // No response at all: the API is down, or the browser blocked the request.
      return Promise.reject(
        Object.assign(new Error("Can't reach the server. Check that the API is running."), {
          status: 0,
          isNetworkError: true,
        })
      );
    }

    const { status, data } = error.response;

    if (status === 401) {
      // The token is expired, forged, or was revoked (for example the account's role
      // changed). Drop it so the UI stops pretending to be logged in.
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch {
        /* storage unavailable; nothing else to do */
      }
      if (onUnauthorized) onUnauthorized();
    }

    const message =
      data?.message ||
      (status === 403
        ? "Your account doesn't have permission to do that."
        : "Something went wrong. Please try again.");

    return Promise.reject(
      Object.assign(new Error(message), {
        status,
        // Field-level messages from bean validation, used to highlight specific inputs.
        fieldErrors: data?.fieldErrors || null,
        field: data?.field || null,
      })
    );
  }
);

export default http;
