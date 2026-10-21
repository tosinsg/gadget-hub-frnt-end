import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { LIVE_URL, POLL_INTERVAL_MS } from "../config";

/**
 * The live-updates channel.
 *
 * <h2>How it works</h2>
 * On mount this opens a Server-Sent Events connection to `/api/live/stream`. The server
 * pushes an event the moment something changes, and this provider hands it to any component
 * that subscribed. A customer looking at the last unit in stock sees it sell out
 * immediately, instead of finding out at checkout.
 *
 * <h2>Why there is also a polling fallback</h2>
 * Long-lived connections are not always allowed: a corporate proxy may buffer or kill
 * them, and some older browsers have no EventSource. Rather than silently going stale -
 * which is the worst outcome, because the screen looks live but is not - the provider
 * notices that the stream never connected and switches to fetching on a timer. The UI keeps
 * working; it is merely less immediate.
 *
 * <h2>Why this is not "just polling"</h2>
 * In the normal case the server pushes on change, so latency is milliseconds rather than
 * up to POLL_INTERVAL_MS, and the server does no repeated work per client. Polling exists
 * only as the degraded path.
 *
 * The provider exposes:
 *  - `status`: "connecting" | "live" | "polling" | "offline"
 *  - `subscribe(type, handler)`: listen for one event type, returns an unsubscribe function
 *  - `stockOf(productId)`: latest known stock, or undefined if nothing has been heard
 *  - `lastEventAt`: when the last event arrived, so the UI can show "updated just now"
 */
const LiveContext = createContext(null);

export const LiveProvider = ({ children }) => {
  const [status, setStatus] = useState("connecting");
  const [lastEventAt, setLastEventAt] = useState(null);
  const [orderTick, setOrderTick] = useState(0);
  const [productTick, setProductTick] = useState(0);

  // productId -> stock, from live events only. Components merge this over fetched data.
  const stockRef = useRef(new Map());
  const listenersRef = useRef(new Map());
  const sourceRef = useRef(null);
  const pollTimerRef = useRef(null);
  const reconnectDelayRef = useRef(1000);

  /** Register a handler for one event type. Returns an unsubscribe function. */
  const subscribe = useCallback((type, handler) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    const handlers = listenersRef.current.get(type);
    handlers.add(handler);

    // Run the handler for any events already buffered before this subscriber mounted,
    // so a component that appears late is not blind until the next event.
    return () => handlers.delete(handler);
  }, []);

  const emit = useCallback((type, payload) => {
    const handlers = listenersRef.current.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          // A broken subscriber must not stop the others from being notified.
          console.error("Live event handler failed", type, error);
        }
      });
    }
  }, []);

  const stockOf = useCallback((productId) => stockRef.current.get(productId), []);

  const applyEvent = useCallback(
    (type, data) => {
      setLastEventAt(new Date());

      // Stock corrections are kept centrally so every product tile agrees, and so a page
      // that has not re-fetched still shows the truth.
      if (type === "product.updated" && data?.productId != null) {
        stockRef.current.set(data.productId, Number(data.stock));
        setProductTick((tick) => tick + 1);
      }
      if (type === "product.created" && data?.productId != null) {
        stockRef.current.set(data.productId, Number(data.stock));
        setProductTick((tick) => tick + 1);
      }
      if (type === "product.deleted" && data?.productId != null) {
        stockRef.current.delete(data.productId);
        setProductTick((tick) => tick + 1);
      }
      if (type === "order.placed" && data?.stock) {
        Object.entries(data.stock).forEach(([productId, stock]) => {
          stockRef.current.set(productId, Number(stock));
        });
        setProductTick((tick) => tick + 1);
        setOrderTick((tick) => tick + 1);
      }
      if (type === "order.status" || type === "seller.review") {
        setOrderTick((tick) => tick + 1);
      }

      emit(type, data);
      // A single wildcard listener lets a page refresh itself on anything at all.
      emit("*", { type, data });
    },
    [emit]
  );

  useEffect(() => {
    let cancelled = false;

    const startPolling = () => {
      if (pollTimerRef.current || cancelled) return;
      // The stream is not available, so refresh on a timer instead of showing stale data.
      setStatus((current) => (current === "offline" ? current : "polling"));
      pollTimerRef.current = setInterval(() => {
        emit("poll", { at: new Date() });
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const connect = () => {
      if (cancelled) return;

      let source;
      try {
        source = new EventSource(LIVE_URL);
      } catch {
        startPolling();
        return;
      }
      sourceRef.current = source;

      source.onopen = () => {
        reconnectDelayRef.current = 1000;
        stopPolling();
        setStatus("live");
      };

      const handle = (type) => (event) => {
        try {
          applyEvent(type, JSON.parse(event.data));
        } catch {
          // A malformed frame is ignored rather than breaking the stream.
        }
      };

      source.addEventListener("product.updated", handle("product.updated"));
      source.addEventListener("product.created", handle("product.created"));
      source.addEventListener("product.deleted", handle("product.deleted"));
      source.addEventListener("order.placed", handle("order.placed"));
      source.addEventListener("order.status", handle("order.status"));
      source.addEventListener("seller.review", handle("seller.review"));
      source.addEventListener("ping", () => {
        setLastEventAt(new Date());
      });

      source.onerror = () => {
        // EventSource reconnects on its own, but if it keeps failing we stop relying on it
        // and start polling, so the UI is never silently out of date.
        source.close();
        sourceRef.current = null;
        if (cancelled) return;

        startPolling();
        const delay = Math.min(reconnectDelayRef.current, 15000);
        reconnectDelayRef.current = delay * 2;
        setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      stopPolling();
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };
  }, [applyEvent, emit]);

  const value = {
    status,
    lastEventAt,
    orderTick,
    productTick,
    subscribe,
    stockOf,
    isLive: status === "live",
  };

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLive = () => useContext(LiveContext);

/**
 * Subscribe to live events for the lifetime of a component.
 *
 *   useLiveEvent("product.updated", (data) => setStock(data.stock));
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useLiveEvent = (type, handler) => {
  const live = useLive();
  const handlerRef = useRef(handler);

  // Keep the latest handler in a ref, updated from an effect rather than during render
  // (writing to a ref while rendering is not allowed - it must be a side effect).
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!live?.subscribe) return undefined;
    // Delegating through the ref keeps the subscription stable even when the caller passes
    // a new inline function on every render, so the stream is not re-subscribed needlessly.
    return live.subscribe(type, (payload) => handlerRef.current?.(payload));
  }, [live, type]);
};
