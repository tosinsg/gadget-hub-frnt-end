// The browser talks only to the Spring Boot REST API, never directly to MongoDB.
//
// Vite exposes only variables prefixed with VITE_, and inlines them at BUILD time - so
// changing VITE_API_URL requires restarting the dev server. There is no fallback that
// invents data: if the API is unreachable the UI says so.
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

// The live event stream (Server-Sent Events). Updates are pushed from the server the
// moment stock or an order status changes.
export const LIVE_URL = `${API_URL}/live/stream`;

// If the stream cannot connect, the UI falls back to polling so it still refreshes -
// just less immediately. The stream is the normal path.
export const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS || 15000);

// Kept in step with the server's LiveEventService.LOW_STOCK_THRESHOLD, so "only a few
// left" means the same thing on both sides.
export const LOW_STOCK_THRESHOLD = 5;
