import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getOrderById } from "../../api/orderAPI";
import { formatPriceExact, formatDateTime, orderStatusInfo } from "../../utils/format";

/**
 * One order, in full.
 *
 * The server decides who may read this: only the buyer who placed it, a seller with a line
 * in it, or an admin. Everyone else gets a 404 - not a 403 - so the endpoint cannot be used
 * to discover which order ids exist.
 */
const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getOrderById(id);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) setError(err.status === 404 ? "notfound" : err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F10]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="h-64 rounded-lg bg-[#12181A] border border-[#212A2C] animate-pulse" aria-busy="true" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0B0F10]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-semibold text-[#EDEFEF] mb-3">
            {error === "notfound" ? "We couldn't find that order." : "Something went wrong loading this order."}
          </h1>
          <p className="text-[#8B9494] mb-8">
            You can only view orders that belong to your account.
          </p>
          <Link to="/orders" className="text-[#3DDC97] hover:underline">
            Back to your orders
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const status = orderStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/orders" className="text-sm text-[#8B9494] hover:text-[#EDEFEF]">
          ← Your orders
        </Link>

        <div className="border border-[#212A2C] rounded-lg bg-[#12181A] p-6 mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[#EDEFEF]">
                Order {String(order.id).slice(-8).toUpperCase()}
              </h1>
              <p className="text-[#8B9494] text-sm mt-1">Placed {formatDateTime(order.createdAt)}</p>
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

          <ul className="space-y-2 text-sm border-t border-[#212A2C] pt-5 mb-5">
            {order.items.map((line) => (
              <li key={line.productId} className="flex justify-between gap-4">
                <span className="text-[#8B9494]">
                  {line.name} × {line.quantity}
                  <span className="text-[#4A5455]"> @ {formatPriceExact(line.unitPrice)}</span>
                </span>
                <span className="text-[#EDEFEF] whitespace-nowrap">{formatPriceExact(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between text-[#EDEFEF] font-semibold border-t border-[#212A2C] pt-4 mb-6">
            <span>Total (pay on delivery)</span>
            <span>{formatPriceExact(order.totalAmount)}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 text-sm border-t border-[#212A2C] pt-5">
            <div>
              <p className="text-[#4A5455] uppercase tracking-wide text-xs mb-1">Delivering to</p>
              <p className="text-[#EDEFEF]">{order.delivery.recipientName}</p>
              <p className="text-[#8B9494]">{order.delivery.addressLine}</p>
              <p className="text-[#8B9494]">
                {order.delivery.city}, {order.delivery.state}
              </p>
            </div>
            <div>
              <p className="text-[#4A5455] uppercase tracking-wide text-xs mb-1">Contact</p>
              <p className="text-[#8B9494]">{order.email}</p>
              <p className="text-[#8B9494]">{order.phone}</p>
            </div>
          </div>

          {order.cancelReason && (
            <p className="text-sm text-[#E0918A] mt-5 border-t border-[#212A2C] pt-4">{order.cancelReason}</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetail;
