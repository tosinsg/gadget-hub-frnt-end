import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import LiveBadge from "../../components/layout/LiveBadge";
import StatCard from "../../components/dashboard/StatCard";
import { useLive, useLiveEvent } from "../../context/LiveContext";
import { useApiData } from "../../hooks/useApiData";
import { getAdminDashboard, reviewSeller } from "../../api/dashboardAPI";
import { formatPriceExact, formatDateTime, orderStatusInfo, sellerStatusInfo } from "../../utils/format";

/**
 * The administrator dashboard.
 *
 * This is where "approved sellers" actually comes from. Without it, `sellerStatus` would
 * never leave PENDING and the whole seller workflow would be dead code - which is precisely
 * the state the previous version was in, except it told applicants they were "pending admin
 * approval" without any way for an admin to approve anything.
 *
 * Three jobs live here:
 *  1. review seller applications (approve / reject, with a note),
 *  2. watch platform health and low stock,
 *  3. see every order and moderate listings.
 */
const AdminDashboard = () => {
  const { status: liveStatus, lastEventAt, orderTick, productTick } = useLive();

  const [notice, setNotice] = useState("");
  const [busySellerId, setBusySellerId] = useState(null);
  const [notes, setNotes] = useState({});

  // Re-fetches automatically when a live event says an order or product changed.
  const { data, error, loading, reload } = useApiData(getAdminDashboard, [orderTick, productTick]);

  // A new application or a new order appears without the admin refreshing the page.
  useLiveEvent("seller.review", () => reload());

  const handleReview = async (sellerId, decision) => {
    setBusySellerId(sellerId);
    setNotice("");
    try {
      const updated = await reviewSeller(sellerId, decision, notes[sellerId] || "");
      setNotice(
        `${updated.storeName || updated.name} was ${decision === "approve" ? "approved" : "rejected"}.`
      );
      reload();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusySellerId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F10]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="h-40 rounded-lg bg-[#12181A] border border-[#212A2C] animate-pulse" aria-busy="true" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0F10]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="text-[#F07178] mb-2">{error || "We couldn't load the dashboard."}</p>
          <button onClick={reload} className="text-[#3DDC97] hover:underline">Try again</button>
        </main>
        <Footer />
      </div>
    );
  }

  const { summary, applications, recentOrders, lowStock } = data;
  const pending = applications.filter((application) => application.status === "pending");

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#7C9CFF] mb-2">Administration</p>
            <h1 className="font-display text-3xl font-semibold text-[#EDEFEF]">Platform overview</h1>
          </div>
          <LiveBadge status={liveStatus} lastEventAt={lastEventAt} />
        </div>

        {notice && (
          <div role="status" className="mb-6 px-4 py-2.5 rounded-md bg-[#132A1F] border border-[#204A35] text-[#7FE0AE] text-sm">
            {notice}
          </div>
        )}

        {/* ---------------- platform health ---------------- */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Buyers" value={summary.buyers} />
          <StatCard label="Sellers" value={summary.sellers} hint={`${summary.pendingSellers} awaiting review`}
            tone={summary.pendingSellers > 0 ? "warn" : "neutral"} />
          <StatCard label="Products" value={summary.products} hint={`${summary.activeProducts} visible`} />
          <StatCard label="Orders" value={summary.orders} tone="accent" />
          <StatCard label="Awaiting dispatch" value={summary.placedOrders} tone={summary.placedOrders > 0 ? "warn" : "neutral"} />
          <StatCard label="Shipped" value={summary.shippedOrders} />
          <StatCard label="Delivered" value={summary.deliveredOrders} tone="good" />
          <StatCard label="Cancelled" value={summary.cancelledOrders} />
          <StatCard label="Order value (not cancelled)" value={formatPriceExact(summary.grossOrderValue)} />
          <StatCard label="Delivered revenue" value={formatPriceExact(summary.deliveredRevenue)} tone="good" />
        </section>

        {/* ---------------- seller review queue ---------------- */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-semibold text-[#EDEFEF] mb-1">
            Seller applications
          </h2>
          <p className="text-sm text-[#8B9494] mb-4">
            Only approved sellers can list products. Approving an application takes effect immediately and
            signs the applicant out so their new permissions are loaded.
          </p>

          {pending.length === 0 && (
            <div className="border border-[#212A2C] rounded-lg bg-[#12181A] p-6 mb-4">
              <p className="text-[#7FE0AE] text-sm">Nothing waiting for review.</p>
            </div>
          )}

          <ul className="space-y-4">
            {applications
              .slice()
              .sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0))
              .map((application) => {
                const status = sellerStatusInfo(application.status);
                const isPending = application.status === "pending";
                return (
                  <li
                    key={application.id}
                    className={`border rounded-lg bg-[#12181A] p-5 ${
                      isPending ? "border-[#4A3A20]" : "border-[#212A2C]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[#EDEFEF] font-medium">{application.storeName || "(no store name)"}</p>
                        <p className="text-sm text-[#8B9494] mt-0.5">
                          {application.name} · {application.email}
                        </p>
                        <p className="text-sm text-[#8B9494] mt-0.5">
                          {application.storeCity} · sells {application.storeCategory} ·{" "}
                          {application.storePhone}
                        </p>
                        <p className="text-xs text-[#4A5455] mt-1">
                          Applied {formatDateTime(application.createdAt)}
                          {application.reviewedAt && ` · reviewed ${formatDateTime(application.reviewedAt)}`}
                        </p>
                        {application.reviewNote && (
                          <p className="text-xs text-[#8B9494] mt-1">Note: “{application.reviewNote}”</p>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full border ${
                          application.status === "approved"
                            ? "border-[#204A35] text-[#7FE0AE] bg-[#132A1F]"
                            : application.status === "rejected"
                            ? "border-[#4A2020] text-[#E0918A] bg-[#2A1414]"
                            : "border-[#4A3A20] text-[#F5B14C]"
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {isPending && (
                      <div className="mt-4 pt-4 border-t border-[#212A2C] flex flex-wrap items-center gap-3">
                        <input
                          value={notes[application.id] || ""}
                          onChange={(event) =>
                            setNotes((previous) => ({ ...previous, [application.id]: event.target.value }))
                          }
                          placeholder="Optional note for the applicant"
                          className="flex-1 min-w-56 px-3 py-2 rounded-md bg-[#0B0F10] text-[#EDEFEF] border border-[#212A2C] placeholder:text-[#4A5455] outline-none focus:border-[#3DDC97] text-sm"
                        />
                        <button
                          onClick={() => handleReview(application.id, "approve")}
                          disabled={busySellerId === application.id}
                          className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-4 py-2 rounded-md hover:bg-[#4FE8A5] text-sm disabled:opacity-50"
                        >
                          {busySellerId === application.id ? "Working…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReview(application.id, "reject")}
                          disabled={busySellerId === application.id}
                          className="border border-[#4A2020] text-[#E0918A] px-4 py-2 rounded-md hover:bg-[#2A1414] text-sm disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>

        {/* ---------------- low stock ---------------- */}
        {lowStock.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-xl font-semibold text-[#EDEFEF] mb-4">
              Low stock on open orders
            </h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStock.map((alert) => (
                <li key={alert.productId} className="border border-[#4A3A20] rounded-lg bg-[#2A2114] px-4 py-3">
                  <Link to={`/products/${alert.productId}`} className="text-[#EDEFEF] text-sm hover:text-[#F5B14C]">
                    {alert.name}
                  </Link>
                  <p className="text-[#F5B14C] text-xs mt-1">
                    {alert.stock} left · buy more or cancel the pending orders
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------------- recent orders ---------------- */}
        <section>
          <h2 className="font-display text-xl font-semibold text-[#EDEFEF] mb-4">Recent orders</h2>
          {recentOrders.length === 0 ? (
            <div className="border border-[#212A2C] rounded-lg bg-[#12181A] p-6">
              <p className="text-[#8B9494] text-sm">No orders yet.</p>
            </div>
          ) : (
            <div className="border border-[#212A2C] rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#12181A] text-[#8B9494]">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Order</th>
                    <th className="text-left font-medium px-4 py-3">Customer</th>
                    <th className="text-right font-medium px-4 py-3">Items</th>
                    <th className="text-right font-medium px-4 py-3">Total</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212A2C]">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="bg-[#0B0F10]">
                      <td className="px-4 py-3 text-[#8B9494] font-mono text-xs">
                        {String(order.id).slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-[#EDEFEF]">
                        {order.customerName}
                        <span className="block text-xs text-[#4A5455]">{order.email}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#8B9494]">{order.itemCount}</td>
                      <td className="px-4 py-3 text-right text-[#EDEFEF] whitespace-nowrap">
                        {formatPriceExact(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#F5B14C]">{orderStatusInfo(order.status).label}</span>
                      </td>
                      <td className="px-4 py-3 text-[#8B9494] text-xs whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
