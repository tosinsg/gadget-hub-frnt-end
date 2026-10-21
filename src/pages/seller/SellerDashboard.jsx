import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import LiveBadge from "../../components/layout/LiveBadge";
import StatCard from "../../components/dashboard/StatCard";
import ProductForm from "../../components/dashboard/ProductForm";
import { useAuth } from "../../context/AuthContext";
import { useLive, useLiveEvent } from "../../context/LiveContext";
import { useApiData } from "../../hooks/useApiData";
import { getSellerDashboard, setSellerOrderStatus } from "../../api/dashboardAPI";
import { deleteProduct, updateProduct } from "../../api/productAPI";
import { formatPrice, formatPriceExact, formatDateTime, orderStatusInfo, sellerStatusInfo } from "../../utils/format";

/**
 * The seller dashboard.
 *
 * This is the half of the marketplace story that did not exist before: the old project
 * collected a store name, promised "pending admin approval", and had no backend concept of
 * approval, no product management and no orders. Here a seller can actually see their
 * status, list and edit products, and move their own orders from placed to shipped to
 * delivered.
 *
 * A PENDING applicant sees the same page with a clear "waiting for approval" panel and the
 * listing controls disabled - matching what the server will and will not accept, rather than
 * showing buttons that fail.
 */
const SellerDashboard = () => {
  const { user, refresh, canSell } = useAuth();
  const { status: liveStatus, lastEventAt, productTick, orderTick } = useLive();

  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null); // product being edited, or "new"
  const [busyOrderId, setBusyOrderId] = useState(null);

  // Re-fetches automatically when a live event says a product or order changed.
  const { data, error, loading, reload } = useApiData(getSellerDashboard, [user?.id, productTick, orderTick]);

  // When an admin approves or rejects this application, pull the fresh status in so the
  // page stops showing "pending" without a manual reload.
  useLiveEvent("seller.review", async (event) => {
    if (event?.sellerId === user?.id) {
      setNotice(
        event.decision === "approved"
          ? "Your seller application was approved. You can list products now."
          : "Your seller application was reviewed."
      );
      await refresh();
      reload();
    }
  });

  const handleStatusChange = async (orderId, nextStatus) => {
    setBusyOrderId(orderId);
    setNotice("");
    try {
      await setSellerOrderStatus(orderId, nextStatus, "");
      setNotice(`Order marked as ${nextStatus}.`);
      reload();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleDelete = async (product) => {
    setNotice("");
    try {
      await deleteProduct(product.id);
      setNotice(`"${product.name}" was removed from the storefront.`);
      reload();
    } catch (err) {
      setNotice(err.message);
    }
  };

  const handleToggleActive = async (product) => {
    setNotice("");
    try {
      await updateProduct(product.id, { active: !product.active });
      reload();
    } catch (err) {
      setNotice(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F10]">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-12">
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
          <p className="text-[#F07178] mb-2">{error || "We couldn't load your dashboard."}</p>
          <button onClick={reload} className="text-[#3DDC97] hover:underline">Try again</button>
        </main>
        <Footer />
      </div>
    );
  }

  const { summary, products, orders } = data;
  const statusInfo = sellerStatusInfo(summary.sellerStatus);
  const approved = canSell;

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#7C9CFF] mb-2">Seller dashboard</p>
            <h1 className="font-display text-3xl font-semibold text-[#EDEFEF]">{summary.storeName}</h1>
            <p className="text-[#8B9494] text-sm mt-1">
              Signed in as {user.name} · {user.email}
            </p>
          </div>
          <LiveBadge status={liveStatus} lastEventAt={lastEventAt} />
        </div>

        {/* Application status: the honest version of "pending admin approval". */}
        <div
          className={`mb-8 px-5 py-4 rounded-lg border text-sm ${
            summary.sellerStatus === "approved"
              ? "border-[#204A35] bg-[#132A1F] text-[#7FE0AE]"
              : summary.sellerStatus === "rejected"
              ? "border-[#4A2020] bg-[#2A1414] text-[#E0918A]"
              : "border-[#4A3A20] bg-[#2A2114] text-[#F5B14C]"
          }`}
        >
          <p className="font-medium">Application status: {statusInfo.label}</p>
          <p className="mt-1 opacity-90">{statusInfo.description}</p>
          {summary.reviewNote && (
            <p className="mt-2 opacity-90">Note from the administrator: “{summary.reviewNote}”</p>
          )}
        </div>

        {notice && (
          <div role="status" className="mb-6 px-4 py-2.5 rounded-md bg-[#12181A] border border-[#212A2C] text-[#EDEFEF] text-sm">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Listings" value={summary.productCount} hint={`${summary.activeProductCount} visible`} />
          <StatCard
            label="Low stock"
            value={summary.lowStockCount}
            tone={summary.lowStockCount > 0 ? "warn" : "neutral"}
            hint="5 or fewer left"
          />
          <StatCard
            label="Out of stock"
            value={summary.outOfStockCount}
            tone={summary.outOfStockCount > 0 ? "bad" : "neutral"}
          />
          <StatCard
            label="Orders"
            value={summary.orderCount}
            tone="accent"
            hint={`${summary.pendingOrderCount} waiting to ship`}
          />
          <StatCard label="Revenue (not cancelled)" value={formatPrice(summary.revenue)} tone="good" />
          <StatCard label="Units sold" value={summary.unitsSold} />
        </section>

        {/* ---------------- listings ---------------- */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-[#EDEFEF]">Your listings</h2>
            <button
              onClick={() => setEditing("new")}
              disabled={!approved}
              title={approved ? undefined : "You can list products once an administrator approves your store."}
              className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-4 py-2 rounded-md hover:bg-[#4FE8A5] transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add a product
            </button>
          </div>

          {editing && (
            <ProductForm
              product={editing === "new" ? null : editing}
              onCancel={() => setEditing(null)}
              onSaved={async (message) => {
                setEditing(null);
                setNotice(message);
                reload();
              }}
            />
          )}

          {products.length === 0 ? (
            <div className="border border-[#212A2C] rounded-lg bg-[#12181A] p-8 text-center">
              <p className="text-[#8B9494] text-sm">
                {approved
                  ? "You haven't listed anything yet. Add your first product to appear in the shop."
                  : "Once your application is approved you can list products here."}
              </p>
            </div>
          ) : (
            <div className="border border-[#212A2C] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#12181A] text-[#8B9494]">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Product</th>
                    <th className="text-right font-medium px-4 py-3">Price</th>
                    <th className="text-right font-medium px-4 py-3">Stock</th>
                    <th className="text-right font-medium px-4 py-3">Sold</th>
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212A2C]">
                  {products.map((product) => (
                    <tr key={product.id} className="bg-[#0B0F10]">
                      <td className="px-4 py-3">
                        <Link to={`/products/${product.id}`} className="text-[#EDEFEF] hover:text-[#3DDC97]">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[#8B9494]">{product.category}</span>
                          {!product.active && (
                            <span className="text-xs px-1.5 py-0.5 rounded border border-[#4A3A20] text-[#F5B14C]">
                              Hidden
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[#EDEFEF] whitespace-nowrap">
                        {formatPrice(product.price)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right whitespace-nowrap ${
                          product.stock === 0
                            ? "text-[#F07178]"
                            : product.stock <= 5
                            ? "text-[#F5B14C]"
                            : "text-[#EDEFEF]"
                        }`}
                      >
                        {product.stock}
                      </td>
                      <td className="px-4 py-3 text-right text-[#8B9494]">{product.unitsSold}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditing(product)}
                          className="text-[#7C9CFF] hover:underline text-xs mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className="text-[#8B9494] hover:underline text-xs mr-3"
                        >
                          {product.active ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-[#F07178] hover:underline text-xs"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------------- orders ---------------- */}
        <section>
          <h2 className="font-display text-xl font-semibold text-[#EDEFEF] mb-4">
            Orders for your products
          </h2>
          {orders.length === 0 ? (
            <div className="border border-[#212A2C] rounded-lg bg-[#12181A] p-8 text-center">
              <p className="text-[#8B9494] text-sm">No orders yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => {
                const status = orderStatusInfo(order.status);
                const isPlaced = String(order.status).toLowerCase() === "placed";
                const isShipped = String(order.status).toLowerCase() === "shipped";
                return (
                  <li key={order.id} className="border border-[#212A2C] rounded-lg bg-[#12181A] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[#EDEFEF] font-medium">
                          Order {String(order.id).slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-[#8B9494]">{formatDateTime(order.createdAt)}</p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full border border-[#212A2C] text-[#F5B14C]">
                        {status.label}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-sm mb-3">
                      {order.items.map((line) => (
                        <li key={line.productId} className="flex justify-between gap-4">
                          <span className="text-[#8B9494]">
                            {line.name} × {line.quantity}
                          </span>
                          <span className="text-[#EDEFEF]">{formatPriceExact(line.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>

                    {/* The seller needs the delivery address to actually deliver. */}
                    <div className="text-sm text-[#8B9494] border-t border-[#212A2C] pt-3 mb-3">
                      <p>
                        Deliver to <span className="text-[#EDEFEF]">{order.delivery.recipientName}</span> ·{" "}
                        {order.delivery.phone}
                      </p>
                      <p>
                        {order.delivery.addressLine}, {order.delivery.city}, {order.delivery.state}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {isPlaced && (
                        <button
                          onClick={() => handleStatusChange(order.id, "shipped")}
                          disabled={busyOrderId === order.id}
                          className="text-sm bg-[#3DDC97] text-[#0B0F10] font-semibold px-4 py-1.5 rounded-md hover:bg-[#4FE8A5] disabled:opacity-50"
                        >
                          {busyOrderId === order.id ? "Updating..." : "Mark as shipped"}
                        </button>
                      )}
                      {isShipped && (
                        <button
                          onClick={() => handleStatusChange(order.id, "delivered")}
                          disabled={busyOrderId === order.id}
                          className="text-sm bg-[#3DDC97] text-[#0B0F10] font-semibold px-4 py-1.5 rounded-md hover:bg-[#4FE8A5] disabled:opacity-50"
                        >
                          {busyOrderId === order.id ? "Updating..." : "Mark as delivered"}
                        </button>
                      )}
                      {!isPlaced && !isShipped && (
                        <p className="text-xs text-[#4A5455]">This order is closed.</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
