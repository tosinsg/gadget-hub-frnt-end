import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ProductCard from "../../components/product/ProductCard";
import ProductImage from "../../components/product/ProductImage";
import { getProductById, getRelatedProducts } from "../../api/productAPI";
import { useCart } from "../../context/CartContext";
import { useLive, useLiveEvent } from "../../context/LiveContext";
import { formatPrice, stockInfo } from "../../utils/format";
import { QUANTITY_MAX } from "../../utils/validation";
import { LOW_STOCK_THRESHOLD } from "../../config";

const toneClass = { in: "text-[#3DDC97]", low: "text-[#F5B14C]", out: "text-[#F07178]" };

/**
 * Product detail.
 *
 * The stock here is live: if someone else buys the last unit while this page is open, the
 * quantity selector clamps itself and a message explains why, rather than letting the
 * customer fill in a checkout form the server will reject.
 */
const ProductDetail = () => {
  const { id } = useParams();
  const { addItem, items } = useCart();
  const { stockOf } = useLive();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(null);
  const [adjustment, setAdjustment] = useState("");

  // Fetch when the id changes.
  //
  // Everything that resets per-product state (the quantity selector, the "added" message)
  // happens AFTER the await below, so no state is set synchronously while the effect is
  // running - which is what the lint rule is protecting against, and what would otherwise
  // cause a cascading render before the first one has committed.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const data = await getProductById(id);
        if (cancelled) return;
        setProduct(data);
        setQuantity(1);
        setAdded(null);
        setAdjustment("");
        setError("");

        const relatedData = await getRelatedProducts(id, 4).catch(() => []);
        if (!cancelled) setRelated(relatedData);
      } catch (err) {
        if (cancelled) return;
        setProduct(null);
        setError(err.status === 404 ? "notfound" : "failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Someone bought the last few while this page was open: correct the selector.
  useLiveEvent("product.updated", (event) => {
    if (event?.productId !== id) return;

    const available = Number(event.stock) || 0;
    setQuantity((current) => {
      const ceiling = Math.max(1, Math.min(available, QUANTITY_MAX));
      if (current > ceiling) {
        setAdjustment(
          available <= 0
            ? "This item just sold out."
            : `Stock changed while you were looking — reduced to ${ceiling}.`
        );
        return ceiling;
      }
      return current;
    });

    if (available <= 0) {
      setAdjustment("This item just sold out.");
    }
  });

  const liveStock = product ? stockOf(product.id) : undefined;
  const stockValue = product ? (liveStock === undefined ? product.stock : liveStock) : 0;
  const stock = product ? stockInfo(stockValue, LOW_STOCK_THRESHOLD) : null;
  const maxQty = Math.max(1, Math.min(stockValue, QUANTITY_MAX));
  const inCart = product ? items.find((line) => line.id === product.id)?.quantity || 0 : 0;

  const handleAdd = () => {
    if (!product) return;
    // Pass the live stock so the cart clamps against what is actually available now.
    const outcome = addItem({ ...product, stock: stockValue }, quantity);
    if (outcome.ok) {
      setAdded(quantity);
      setAdjustment("");
    } else {
      setAdjustment(outcome.reason || "Couldn't add that to your cart.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-10 animate-pulse" aria-busy="true">
            <div className="aspect-square bg-[#12181A] rounded-lg" />
            <div className="space-y-4">
              <div className="h-4 bg-[#12181A] rounded w-1/4" />
              <div className="h-8 bg-[#12181A] rounded w-3/4" />
              <div className="h-6 bg-[#12181A] rounded w-1/3" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-[#EDEFEF] text-lg mb-2">
              {error === "notfound"
                ? "We couldn't find that product."
                : "Something went wrong loading this product."}
            </p>
            <Link to="/products" className="text-[#3DDC97] hover:underline">Back to all products</Link>
          </div>
        ) : (
          <>
            <nav className="text-sm text-[#8B9494] mb-6" aria-label="Breadcrumb">
              <Link to="/products" className="hover:text-[#EDEFEF]">Shop</Link>
              {" / "}
              <Link
                to={`/products?category=${encodeURIComponent(product.category)}`}
                className="hover:text-[#EDEFEF]"
              >
                {product.category}
              </Link>
              {" / "}
              <span className="text-[#EDEFEF]">{product.name}</span>
            </nav>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="border border-[#212A2C] rounded-lg bg-[#12181A] aspect-square overflow-hidden">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  name={product.name}
                  className="w-full h-full object-contain p-8"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-[#8B9494] mb-2">
                  {product.brand ? `${product.brand} · ` : ""}{product.category}
                </p>
                <h1 className="font-display text-3xl font-semibold text-[#EDEFEF] mb-3">{product.name}</h1>

                {product.sellerName && (
                  <p className="text-sm text-[#8B9494] mb-3">
                    Sold by <span className="text-[#EDEFEF]">{product.sellerName}</span>
                  </p>
                )}

                <p className="text-3xl font-semibold text-[#3DDC97] mb-2">{formatPrice(product.price)}</p>
                <p className={`text-sm mb-2 ${toneClass[stock.tone]}`}>{stock.label}</p>
                {product.unitsSold > 0 && (
                  <p className="text-xs text-[#8B9494] mb-4">{product.unitsSold} sold so far</p>
                )}

                <p className="text-[#8B9494] leading-relaxed mb-8 mt-4">{product.description}</p>

                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <div className="flex items-center border border-[#212A2C] rounded-md" role="group" aria-label="Quantity">
                    <button
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      disabled={stockValue <= 0 || quantity <= 1}
                      aria-label="Decrease quantity"
                      className="px-3 py-2 text-[#EDEFEF] disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="px-4 text-[#EDEFEF] min-w-10 text-center" aria-live="polite">{quantity}</span>
                    <button
                      onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
                      disabled={stockValue <= 0 || quantity >= maxQty}
                      aria-label="Increase quantity"
                      className="px-3 py-2 text-[#EDEFEF] disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={stockValue <= 0}
                    className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-6 py-2.5 rounded-md hover:bg-[#4FE8A5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {stockValue <= 0 ? "Out of stock" : "Add to cart"}
                  </button>
                </div>

                {adjustment && <p className="text-sm text-[#F5B14C]" role="status">{adjustment}</p>}
                {!adjustment && added && (
                  <p className="text-sm text-[#3DDC97]" role="status">
                    Added {added} to your cart. <Link to="/cart" className="underline">View cart</Link>
                  </p>
                )}
                {!adjustment && !added && inCart > 0 && (
                  <p className="text-sm text-[#8B9494]">
                    {inCart} already in your cart.{" "}
                    <Link to="/cart" className="text-[#7C9CFF] hover:underline">View cart</Link>
                  </p>
                )}
              </div>
            </div>

            {related.length > 0 && (
              <section className="mt-20">
                <h2 className="font-display text-2xl font-semibold text-[#EDEFEF] mb-6">
                  More in {product.category}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {related.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
