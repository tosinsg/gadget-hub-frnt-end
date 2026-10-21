import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLive, useLiveEvent } from "../../context/LiveContext";
import { getMyOrders, cancelOrder } from "../../api/orderAPI";
import { formatPriceExact, formatDateTime, orderStatusInfo, pluralise } from "../../utils/format";

/**
 * Buyer order history.
 *
 * This page is the fix for a specific broken promise: the home page advertised "keep your
 * orders in one place", `GET /orders/mine` existed on the server, and nothing in the UI ever
 * called it. Guests also could not look their order up afterwards, so a guest order vanished
 * the moment the confirmation page was closed.
 *
 * Orders refresh live: when a seller ships something, the change arrives over the event
 * stream and this list updates without a reload.
 */
const Orders = () => {
  const { user } = useAuth();
  const { reconcile } = useCart();
  const { orderTick } = useLive();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await getMyOrders();
        if (!cancelled) {
          setOrders(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, orderTick]);

  // If a seller ships or cancels something, this list is already being re-fetched by the
  // orderTick dependency above; the event is also a cue to refresh cart stock figures.
  useLiveEvent("order.status", () => setNotice("An order was just updated."));

  const handleCancel = async (order) => {
    setBusyId(order.id);
    setNotice("");
    try {
      await cancelOrder(order.id, "Cancelled by the customer.");
      // Cancelling returns the stock to the shop, so refresh the catalogue view of it.
      const stockCorrections = {};
      order.items.forEach((line) => {
        stockCorrections[line.productId] = (stockCorrections[line.productId] || 0) + line.quantity;
      });
      reconcile(stockCorrections);
      setNotice(`Order for ${pluralise(order.items.length, "item")} was cancelled and the stock returned.`);
      setOrders((previous) =>
        previous.map((existing) =>
          existing.id === order.id ? { ...existing, status: "cancelled", cancelReason: "Cancelled by the customer." } : existing
        )
      );
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F10]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="font-display text-3xl font-semibold text-[#EDEFEF] mb-3">Your orders</h1>
          <p className="text-[#8B9494] mb-8">
            Log in to see your orders. Orders placed as a guest can't be looked up afterwards, which is one
            good reason to have an account.
          </p>
          <Link
            to="/login"
            className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-6 py-3 rounded-md hover:bg-[#4FE8A5] transition-colors"
          >
            Log in
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-semibold text-[#EDEFEF] mb-2">Your orders</h1>
        <p className="text-[#8B9494] text-sm mb-8">
          Pay on delivery. The status updates on its own as the seller ships your order.
        </p>

        {notice && (
          <div role="status" className="mb-6 px-4 py-2.5 rounded-md bg-[#132A1F] border border-[#204A35] text-[#7FE0AE] text-sm">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 rounded-lg bg-[#12181A] border border-[#212A2C] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-[#212A2C] rounded-lg bg-[#12181A]">
            <p className="text-[#F07178] mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#3DDC97] hover:underline text-sm"
            >
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 border border-[#212A2C] rounded-lg bg-[#12181A]">
            <p className="text-[#EDEFEF] text-lg mb-2">No orders yet</p>
            <p className="text-[#8B9494] text-sm mb-6">When you place an order it will appear here.</p>
            <Link
              to="/products"
              className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-6 py-3 rounded-md hover:bg-[#4FE8A5] transition-colors"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="space-y-5">
            {orders.map((order) => {
              const status = orderStatusInfo(order.status);
              const canCancel = String(order.status).toLowerCase() === "placed";
              return (
                <li key={order.id} className="border border-[#212A2C] rounded-lg bg-[#12181A] overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#212A2C]">
                    <div>
                      <p className="text-[#EDEFEF] font-medium">
                        Order {String(order.id).slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-[#8B9494] mt-0.5">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full border ${
                        status.tone === "done"
                          ? "border-[#204A35] text-[#7FE0AE] bg-[#132A1F]"
                          : status.tone === "cancelled"
                          ? "border-[#4A2020] text-[#E0918A] bg-[#2A1414]"
                          : "border-[#212A2C] text-[#F5B14C]"
                      }`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="px-5 py-4">
                    <ul className="space-y-2 text-sm mb-4">
                      {order.items.map((line) => (
                        <li key={line.productId} className="flex justify-between gap-4">
                          <span className="text-[#8B9494]">
                            {line.name} × {line.quantity}
                          </span>
                          <span className="text-[#EDEFEF] whitespace-nowrap">
                            {formatPriceExact(line.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[#212A2C] pt-4">
                      <div className="text-sm">
                        <p className="text-[#8B9494]">
                          Delivering to {order.delivery.addressLine}, {order.delivery.city}, {order.delivery.state}
                        </p>
                        <p className="text-[#8B9494] mt-0.5">{status.description}</p>
                        {order.cancelReason && (
                          <p className="text-[#E0918A] mt-1">{order.cancelReason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#8B9494]">Total (pay on delivery)</p>
                        <p className="text-[#3DDC97] font-semibold text-lg">
                          {formatPriceExact(order.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-sm text-[#7C9CFF] hover:underline"
                      >
                        View details
                      </Link>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(order)}
                          disabled={busyId === order.id}
                          className="text-sm text-[#F07178] hover:underline disabled:opacity-50"
                        >
                          {busyId === order.id ? "Cancelling..." : "Cancel order"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
