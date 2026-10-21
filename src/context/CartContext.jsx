import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { QUANTITY_MAX } from "../utils/validation";

/**
 * The cart.
 *
 * It lives in localStorage, which is fine because a cart is a convenience, not a claim:
 * nothing here is trusted at checkout. The server re-reads every product, re-prices every
 * line, and re-checks every stock level when the order is placed.
 *
 * Two behaviours that matter:
 *
 * 1. **Quantity is clamped to known stock** so the user is not led into a request the server
 *    will reject.
 *
 * 2. **Live stock events correct the cart.** If someone else buys the last unit while this
 *    cart is open, `reconcile` drops the quantity and reports it, rather than letting the
 *    customer reach checkout and fail. That is the payoff of the live channel on the buyer
 *    side.
 */
const CartContext = createContext(null);
const STORAGE_KEY = "gadgethub_cart";

const readStoredCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    // Drop anything that does not look like a cart line, so a corrupted entry cannot
    // produce NaN totals all over the UI.
    return parsed
      .filter((item) => item && typeof item.id === "string" && item.name)
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        image: item.image ?? null,
        stock: Number(item.stock) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable; the cart simply won't survive a reload */
    }
  }, [items]);

  /** Add a product, or raise the quantity if it is already there. */
  const addItem = useCallback((product, quantity = 1) => {
    if (!product?.id) return { ok: false, reason: "That product is unavailable." };
    if (Number(product.stock) <= 0) return { ok: false, reason: "That item is out of stock." };

    const wanted = Math.max(1, Number(quantity) || 1);
    let outcome = { ok: true, added: wanted };

    setItems((previous) => {
      const existing = previous.find((line) => line.id === product.id);
      const available = Math.max(0, Number(product.stock) || 0);
      // Never exceed what is actually in stock, nor the server's per-line cap.
      const ceiling = Math.min(available, QUANTITY_MAX);

      if (existing) {
        const combined = Math.min(existing.quantity + wanted, ceiling);
        outcome = {
          ok: combined > existing.quantity,
          added: combined - existing.quantity,
          reason: combined > existing.quantity ? undefined : `Only ${ceiling} available.`,
        };
        return previous.map((line) =>
          line.id === product.id ? { ...line, quantity: combined, stock: available, price: product.price } : line
        );
      }

      const initial = Math.min(wanted, ceiling);
      outcome = { ok: true, added: initial };
      return [
        ...previous,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          image: product.image ?? null,
          stock: available,
          quantity: initial,
        },
      ];
    });

    return outcome;
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setItems((previous) =>
      previous.map((line) => {
        if (line.id !== id) return line;
        const ceiling = Math.max(1, Math.min(Number(line.stock) || 1, QUANTITY_MAX));
        return { ...line, quantity: Math.max(1, Math.min(Number(quantity) || 1, ceiling)) };
      })
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((previous) => previous.filter((line) => line.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  /**
   * Apply live stock information.
   *
   * Called when the server pushes a stock change. If an item is now out of stock it is
   * removed and reported; if there is simply less of it, the quantity is reduced. The
   * caller can then tell the user, instead of letting them discover it at checkout.
   */
  const reconcile = useCallback((stockByProductId) => {
    const changes = [];
    setItems((previous) => {
      const next = [];
      for (const line of previous) {
        const live = stockByProductId[line.id];
        if (live === undefined) {
          next.push(line);
          continue;
        }
        const available = Number(live) || 0;
        if (available <= 0) {
          changes.push({ type: "removed", name: line.name });
          continue;
        }
        if (line.quantity > available) {
          changes.push({ type: "reduced", name: line.name, quantity: available });
          next.push({ ...line, quantity: available, stock: available });
          continue;
        }
        next.push({ ...line, stock: available });
      }
      return next;
    });
    return changes;
  }, []);

  /** Refresh each line's price and stock from freshly fetched catalogue data. */
  const syncWithProducts = useCallback((products) => {
    if (!Array.isArray(products) || products.length === 0) return;
    const byId = new Map(products.map((product) => [product.id, product]));
    setItems((previous) =>
      previous
        .map((line) => {
          const fresh = byId.get(line.id);
          if (!fresh) return line;
          return { ...line, price: Number(fresh.price) || line.price, stock: Number(fresh.stock) || 0 };
        })
        .filter((line) => line.stock > 0)
    );
  }, []);

  const value = useMemo(() => {
    const totalItems = items.reduce((sum, line) => sum + line.quantity, 0);
    // Displayed only. The server recalculates the real total from its own prices.
    const subtotal = items.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const hasIssue = items.some((line) => line.quantity > line.stock);
    const isSellable = items.length > 0 && items.every((line) => line.stock > 0);

    return {
      items,
      totalItems,
      subtotal,
      hasIssue,
      isSellable,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      reconcile,
      syncWithProducts,
    };
  }, [items, addItem, updateQuantity, removeItem, clearCart, reconcile, syncWithProducts]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
