import { Link, Navigate, useLocation } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useAuth } from "../../context/AuthContext";
import { formatPriceExact } from "../../utils/format";

/**
 * Order confirmation.
 *
 * Everything shown here comes from the server's response, kept in router state - there is no
 * fabricated "order" and no local-only success. If someone reloads this page the state is
 * gone and it redirects home, which is honest: a confirmation that survived a reload would
 * have to be re-fetched, and `GET /orders/{id}` requires the buyer to be signed in.
 *
 * Signed-in buyers are pointed at their order history, where the order genuinely persists and
 * stays up to date as the seller ships it.
 */
const OrderSuccess = () => {
  const { state } = useLocation();
  const { user } = useAuth();

  if (!state?.orderId) return <Navigate to="/" replace />;

  const { orderId, items, totalAmount, delivery } = state;

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="border border-[#212A2C] rounded-lg bg-[#12181A] p-8">
          <h1 className="font-display text-3xl font-semibold text-[#EDEFEF] mb-2">Order placed</h1>
          <p className="text-[#8B9494] mb-6">
            Thank you, {String(delivery?.recipientName || "").split(" ")[0] || "there"}. Your order number is{" "}
            <span className="text-[#3DDC97] font-medium">{String(orderId).slice(-8).toUpperCase()}</span>.
          </p>

          <ul className="space-y-2 text-sm mb-4">
            {items?.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3">
                <span className="text-[#8B9494]">{item.name} × {item.quantity}</span>
                <span className="text-[#EDEFEF]">{formatPriceExact(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between text-[#EDEFEF] font-semibold border-t border-[#212A2C] pt-4 mb-6">
            <span>Total (pay on delivery)</span>
            <span>{formatPriceExact(totalAmount)}</span>
          </div>

          {delivery && (
            <p className="text-sm text-[#8B9494] mb-6">
              Delivering to {delivery.addressLine}, {delivery.city}, {delivery.state}.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-6 py-2.5 rounded-md hover:bg-[#4FE8A5] transition-colors"
            >
              Continue shopping
            </Link>
            <Link
              to={user ? "/orders" : "/register"}
              className="border border-[#212A2C] text-[#EDEFEF] font-medium px-6 py-2.5 rounded-md hover:border-[#3DDC97] transition-colors"
            >
              {user ? "View your orders" : "Create an account to track it"}
            </Link>
          </div>

          {!user && (
            <p className="text-xs text-[#4A5455] mt-4">
              You ordered as a guest, so keep your order number. Without an account this order can't be
              looked up later.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccess;
