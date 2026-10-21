import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { createOrder } from "../../api/orderAPI";
import { formatPriceExact } from "../../utils/format";
import { validateDelivery, isValid } from "../../utils/validation";

/**
 * Checkout.
 *
 * What this page does NOT do, deliberately: it does not send prices, and it does not decide
 * the total. It sends product ids and quantities plus the delivery address; the server looks
 * up each product, prices it from the database, checks stock and computes the total. That is
 * why editing the DOM here cannot buy a laptop for one Naira.
 *
 * The availability of every line is re-checked on submit, and a 409 from the server (stock
 * changed while the form was being filled in) is surfaced as a clear message rather than a
 * generic failure.
 */
const Field = ({ label, name, value, onChange, error, type = "text", autoComplete, className = "", hint }) => (
  <div className={className}>
    <label htmlFor={name} className="block text-sm text-[#8B9494] mb-1.5">{label}</label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
      className={`w-full px-4 py-2.5 rounded-md bg-[#0B0F10] text-[#EDEFEF] border outline-none transition-colors focus:border-[#3DDC97] ${
        error ? "border-[#F07178]" : "border-[#212A2C]"
      }`}
    />
    {error ? (
      <p id={`${name}-error`} className="text-xs text-[#F07178] mt-1">{error}</p>
    ) : hint ? (
      <p id={`${name}-hint`} className="text-xs text-[#4A5455] mt-1">{hint}</p>
    ) : null}
  </div>
);

const Checkout = () => {
  const { items, subtotal, clearCart, isSellable, hasIssue } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    // Pre-fill from the account where we can, so a signed-in buyer types less.
    recipientName: user?.name || "",
    email: user?.email || "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const found = validateDelivery(form);
    setErrors(found);
    if (!isValid(found)) {
      // Move focus to the first problem so the user is not hunting for it.
      const firstField = Object.keys(found)[0];
      document.getElementById(firstField)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({ items, delivery: form });
      clearCart();
      navigate("/order-success", {
        replace: true,
        state: {
          orderId: order.id,
          items: order.items,
          totalAmount: order.totalAmount,
          delivery: order.delivery,
        },
      });
    } catch (err) {
      // The HTTP interceptor has already turned this into a human message, including the
      // stock-conflict case ("Only 2 left in stock for …") that the server returns as a 409.
      setSubmitError(
        err.fieldErrors
          ? Object.values(err.fieldErrors)[0]
          : err.message || "We couldn't place your order. Please try again."
      );
      if (err.fieldErrors) setErrors(err.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  const blocked = !isSellable || hasIssue;

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-semibold text-[#EDEFEF] mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} noValidate className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          <section className="border border-[#212A2C] rounded-lg bg-[#12181A] p-6">
            <h2 className="font-display text-lg font-semibold text-[#EDEFEF] mb-5">Delivery details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field className="sm:col-span-2" label="Full name" name="recipientName"
                value={form.recipientName} onChange={handleChange}
                error={errors.recipientName} autoComplete="name" />
              <Field label="Email" name="email" type="email" value={form.email}
                onChange={handleChange} error={errors.email} autoComplete="email" />
              <Field label="Phone number" name="phone" type="tel" value={form.phone}
                onChange={handleChange} error={errors.phone} autoComplete="tel"
                hint="So the seller can reach you about delivery." />
              <Field className="sm:col-span-2" label="Delivery address" name="addressLine"
                value={form.addressLine} onChange={handleChange}
                error={errors.addressLine} autoComplete="street-address" />
              <Field label="City" name="city" value={form.city} onChange={handleChange}
                error={errors.city} autoComplete="address-level2" />
              <Field label="State" name="state" value={form.state} onChange={handleChange}
                error={errors.state} autoComplete="address-level1" />
            </div>

            <div className="mt-6 border border-[#212A2C] rounded-md p-4 text-sm">
              <p className="text-[#EDEFEF] font-medium">Payment: pay on delivery</p>
              <p className="text-[#8B9494] mt-1">
                Online payment isn't available in this version. You'll pay the seller when your order arrives.
              </p>
            </div>

            {!user && (
              <div className="mt-4 border border-[#212A2C] rounded-md p-4 text-sm">
                <p className="text-[#8B9494]">
                  Checking out as a guest. You can do that — but you won't be able to look this order up
                  afterwards.{" "}
                  <Link to="/login" className="text-[#7C9CFF] hover:underline">Log in</Link> or{" "}
                  <Link to="/register" className="text-[#7C9CFF] hover:underline">create an account</Link>{" "}
                  to keep it.
                </p>
              </div>
            )}
          </section>

          <aside className="border border-[#212A2C] rounded-lg bg-[#12181A] p-5 lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold text-[#EDEFEF] mb-4">Order summary</h2>
            <ul className="space-y-3 mb-4 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="text-[#8B9494]">{item.name} × {item.quantity}</span>
                  <span className="text-[#EDEFEF] whitespace-nowrap">{formatPriceExact(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-[#EDEFEF] font-semibold border-t border-[#212A2C] pt-4 mb-2">
              <span>Total</span>
              <span>{formatPriceExact(subtotal)}</span>
            </div>
            <p className="text-xs text-[#4A5455] mb-6">
              Confirmed by the server from its own prices when you place the order.
            </p>

            {submitError && (
              <p role="alert" className="text-sm text-[#F07178] mb-4">{submitError}</p>
            )}

            {blocked && (
              <p className="text-sm text-[#F5B14C] mb-4">
                Some items are unavailable. <Link to="/cart" className="underline">Review your cart</Link>.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || blocked}
              className="w-full bg-[#3DDC97] text-[#0B0F10] font-semibold py-2.5 rounded-md hover:bg-[#4FE8A5] transition-colors disabled:opacity-60"
            >
              {submitting ? "Placing order..." : "Place order"}
            </button>
            <Link to="/cart" className="block text-center text-sm text-[#8B9494] hover:text-[#EDEFEF] mt-4">
              Back to cart
            </Link>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
