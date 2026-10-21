import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ProductImage from "../../components/product/ProductImage";
import { useCart } from "../../context/CartContext";
import { useLive } from "../../context/LiveContext";
import { formatPrice } from "../../utils/format";
import { QUANTITY_MAX } from "../../utils/validation";

/**
 * The cart.
 *
 * The subtotal shown here is a display figure only - the server recalculates the real total
 * from its own prices at checkout. The cart also watches live stock: if an item sells out or
 * the available quantity drops while this page is open, the line is corrected and the
 * customer is told, rather than discovering it when the order is rejected.
 */
const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalItems, hasIssue, isSellable, reconcile } =
    useCart();
  const { stockOf } = useLive();

  // Live stock corrections we already know about, gathered into one map so the stored cart
  // can be reconciled in a single pass.
  const liveStock = {};
  items.forEach((line) => {
    const value = stockOf(line.id);
    if (value !== undefined) liveStock[line.id] = value;
  });

  // Derive what is actually orderable now, rather than keeping a second copy of the truth.
  const rows = items.map((line) => {
    const live = stockOf(line.id);
    const available = live === undefined ? line.stock : live;
    return {
      ...line,
      effectiveStock: available,
      effectiveQuantity: Math.min(line.quantity, Math.max(available, 0)),
    };
  });

  const soldOut = rows.filter((row) => row.effectiveStock <= 0);

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h1 className="font-display text-3xl font-semibold text-[#EDEFEF]">Your cart</h1>
          {rows.length > 0 && (
            <button
              onClick={() => reconcile(liveStock)}
              className="text-sm text-[#7C9CFF] hover:underline"
            >
              Refresh availability
            </button>
          )}
        </div>

        {soldOut.length > 0 && (
          <div role="alert" className="mb-6 px-4 py-3 rounded-md bg-[#2A2114] border border-[#4A3A20] text-[#F5B14C] text-sm">
            {soldOut.map((row) => row.name).join(", ")}{" "}
            {soldOut.length === 1 ? "is" : "are"} no longer available. Remove{" "}
            {soldOut.length === 1 ? "it" : "them"} to continue.
          </div>
        )}

        {rows.length === 0 ? (
          <div className="text-center py-20 border border-[#212A2C] rounded-lg bg-[#12181A]">
            <p className="text-[#EDEFEF] text-lg mb-2">Your cart is empty</p>
            <p className="text-[#8B9494] text-sm mb-6">Find something you like and add it to your cart.</p>
            <Link
              to="/products"
              className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-6 py-3 rounded-md hover:bg-[#4FE8A5] transition-colors"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
            <ul className="space-y-4">
              {rows.map((row) => (
                <li key={row.id} className="flex gap-4 border border-[#212A2C] rounded-lg bg-[#12181A] p-4">
                  <Link to={`/products/${row.id}`} className="w-24 h-24 shrink-0 bg-[#0B0F10] rounded-md overflow-hidden">
                    <ProductImage src={row.image} alt={row.name} name={row.name} className="w-full h-full object-contain p-2" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${row.id}`}
                      className="text-[#EDEFEF] font-medium hover:text-[#3DDC97] line-clamp-2"
                    >
                      {row.name}
                    </Link>
                    <p className="text-sm text-[#8B9494] mt-1">{formatPrice(row.price)} each</p>

                    {row.effectiveStock <= 0 ? (
                      <p className="text-sm text-[#F07178] mt-3">Out of stock — remove to continue.</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div
                          className="flex items-center border border-[#212A2C] rounded-md"
                          role="group"
                          aria-label={`Quantity for ${row.name}`}
                        >
                          <button
                            onClick={() => updateQuantity(row.id, row.quantity - 1)}
                            disabled={row.quantity <= 1}
                            aria-label="Decrease quantity"
                            className="px-3 py-1 text-[#EDEFEF] disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="px-3 text-[#EDEFEF] text-sm min-w-8 text-center">{row.quantity}</span>
                          <button
                            onClick={() => updateQuantity(row.id, row.quantity + 1)}
                            disabled={row.quantity >= Math.min(row.effectiveStock, QUANTITY_MAX)}
                            aria-label="Increase quantity"
                            className="px-3 py-1 text-[#EDEFEF] disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <button onClick={() => removeItem(row.id)} className="text-sm text-[#F07178] hover:underline">
                          Remove
                        </button>
                      </div>
                    )}

                    {row.effectiveStock > 0 && row.quantity >= row.effectiveStock && (
                      <p className="text-xs text-[#F5B14C] mt-2">
                        Only {row.effectiveStock} in stock — that's the most you can order.
                      </p>
                    )}
                  </div>
                  <p className="text-[#3DDC97] font-semibold whitespace-nowrap">
                    {formatPrice(row.price * row.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <aside className="border border-[#212A2C] rounded-lg bg-[#12181A] p-5 lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-semibold text-[#EDEFEF] mb-4">Order summary</h2>
              <div className="flex justify-between text-sm text-[#8B9494] mb-2">
                <span>Items ({totalItems})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#8B9494] mb-4">
                <span>Delivery</span>
                <span>Arranged after ordering</span>
              </div>
              <div className="flex justify-between text-[#EDEFEF] font-semibold border-t border-[#212A2C] pt-4 mb-2">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-[#4A5455] mb-6">
                The server confirms the final total when you place the order.
              </p>

              {(!isSellable || hasIssue) && (
                <p className="text-sm text-[#F5B14C] mb-4">
                  Fix the availability warnings above before checking out.
                </p>
              )}

              {isSellable && !hasIssue ? (
                <Link
                  to="/checkout"
                  className="block text-center w-full bg-[#3DDC97] text-[#0B0F10] font-semibold py-2.5 rounded-md hover:bg-[#4FE8A5] transition-colors"
                >
                  Proceed to checkout
                </Link>
              ) : (
                <span className="block text-center w-full bg-[#212A2C] text-[#8B9494] font-semibold py-2.5 rounded-md cursor-not-allowed">
                  Proceed to checkout
                </span>
              )}

              <button onClick={clearCart} className="w-full text-center text-sm text-[#8B9494] hover:text-[#EDEFEF] mt-4">
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
