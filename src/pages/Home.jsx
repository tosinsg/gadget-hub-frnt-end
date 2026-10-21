import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import LiveBadge from "../components/layout/LiveBadge";
import { getProducts } from "../api/productAPI";
import { useApiData } from "../hooks/useApiData";
import { useLive } from "../context/LiveContext";
import { useAuth } from "../context/AuthContext";

/**
 * The storefront home page.
 *
 * Trimmed deliberately. The previous version claimed in several places:
 *  - "keep your orders in one place" while no order-history page existed,
 *  - "apply, list your products and manage your orders... reviewed first" while the backend
 *    had no approval step and no dashboard,
 *  - star ratings that could never render.
 *
 * Every claim on this page is now backed by something the app actually does. The category
 * tiles come from the real catalogue rather than a hard-coded list, so an empty category is
 * never offered.
 */
const Section = ({ id, title, linkTo, linkLabel = "View all", children }) => (
  <section id={id} className="max-w-7xl mx-auto px-6 pb-20 scroll-mt-24">
    <div className="flex items-center justify-between mb-6">
      <h2 className="font-display text-2xl font-semibold text-[#EDEFEF]">{title}</h2>
      {linkTo && <Link to={linkTo} className="text-sm text-[#3DDC97] hover:underline">{linkLabel}</Link>}
    </div>
    {children}
  </section>
);

const heroTiles = [
  { name: "Phones", slug: "phones" },
  { name: "Audio", slug: "audio" },
  { name: "Laptops", slug: "laptops" },
  { name: "Gaming", slug: "gaming" },
];

const Home = () => {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const { status: liveStatus, lastEventAt, productTick } = useLive();
  const { user, canSell } = useAuth();
  const [query, setQuery] = useState("");

  // Two real queries: what sells most, and what is newest.
  const { data: top, loading: loadingTop, error } = useApiData(
    () => getProducts({ page: 1, limit: 4, sort: "top_sellers" }),
    [productTick]
  );
  const { data: latest, loading: loadingLatest } = useApiData(
    () => getProducts({ page: 1, limit: 4, sort: "newest" }),
    [productTick]
  );

  const handleSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
  };

  const renderGrid = (data, loading) => {
    if (loading) return <ProductGridSkeleton count={4} />;
    if (error) return <p className="text-[#F07178] text-sm">{error}</p>;
    if (!data?.products?.length) {
      return <p className="text-[#8B9494] text-sm">Nothing here yet.</p>;
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 pt-16 pb-16 relative overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="text-xs uppercase tracking-widest text-[#3DDC97] mb-4">Gadget marketplace</p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#EDEFEF] leading-tight mb-4">
              Gadgets that fit your life.
            </h1>
            <p className="text-[#8B9494] text-lg leading-relaxed mb-8 max-w-lg">
              Phones, laptops, audio, wearables and accessories from independent sellers — with stock
              levels that update live as people buy.
            </p>

            <form onSubmit={handleSearch} role="search" className="flex gap-2 max-w-lg mb-4">
              <label htmlFor="hero-search" className="sr-only">Search products</label>
              <input
                id="hero-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search phones, headphones, brands..."
                className="flex-1 px-4 py-3 rounded-md bg-[#12181A] text-[#EDEFEF] border border-[#212A2C] placeholder:text-[#4A5455] outline-none focus:border-[#3DDC97]"
              />
              <button
                type="submit"
                className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-5 rounded-md hover:bg-[#4FE8A5] transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-4 mb-6">
              <Link
                to="/products"
                className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-6 py-3 rounded-md hover:bg-[#4FE8A5] transition-colors"
              >
                Shop now
              </Link>
              {/* Only offered to people who can actually use it. */}
              {!user && (
                <Link
                  to="/seller/register"
                  className="text-[#EDEFEF] border border-[#212A2C] font-medium px-6 py-3 rounded-md hover:border-[#7C9CFF] transition-colors"
                >
                  Become a seller
                </Link>
              )}
              {user && canSell && (
                <Link
                  to="/seller/dashboard"
                  className="text-[#EDEFEF] border border-[#212A2C] font-medium px-6 py-3 rounded-md hover:border-[#7C9CFF] transition-colors"
                >
                  Seller dashboard
                </Link>
              )}
            </div>

            <LiveBadge status={liveStatus} lastEventAt={lastEventAt} />
          </motion.div>

          <div className="grid grid-cols-2 gap-4" aria-label="Featured categories">
            {heroTiles.map((tile, index) => (
              <motion.div
                key={tile.name}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: [0, -6, 0] }}
                transition={
                  reduce
                    ? undefined
                    : {
                        opacity: { duration: 0.5, delay: 0.1 * index },
                        y: { duration: 5 + index, repeat: Infinity, ease: "easeInOut", delay: 0.4 * index },
                      }
                }
                className={index % 2 === 1 ? "mt-8" : ""}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(tile.name)}`}
                  className="block border border-[#212A2C] rounded-lg bg-[#12181A] overflow-hidden hover:border-[#3DDC97] transition-colors"
                >
                  <img src={`/images/products/${tile.slug}.svg`} alt="" className="w-full aspect-square object-cover" />
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-[#EDEFEF] font-medium">{tile.name}</span>
                    <span className="text-xs text-[#3DDC97]">Shop</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-[#212A2C] rounded-lg bg-[#12181A] p-8">
            <p className="text-xs uppercase tracking-widest text-[#3DDC97] mb-3">For buyers</p>
            <h2 className="font-display text-2xl font-semibold text-[#EDEFEF] mb-2">Shop with a free account</h2>
            <p className="text-[#8B9494] text-sm leading-relaxed mb-6">
              Keep your orders in one place and watch their status change as the seller ships them.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={user ? "/orders" : "/register"}
                className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-5 py-2.5 rounded-md hover:bg-[#4FE8A5] transition-colors"
              >
                {user ? "View your orders" : "Create buyer account"}
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="text-[#EDEFEF] border border-[#212A2C] px-5 py-2.5 rounded-md hover:border-[#3DDC97] transition-colors"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>

          <div className="border border-[#212A2C] rounded-lg bg-[#12181A] p-8">
            <p className="text-xs uppercase tracking-widest text-[#7C9CFF] mb-3">For sellers</p>
            <h2 className="font-display text-2xl font-semibold text-[#EDEFEF] mb-2">Sell your gadgets</h2>
            <p className="text-[#8B9494] text-sm leading-relaxed mb-6">
              Apply for a seller account. An administrator reviews it, and once approved you can list
              products, manage stock and fulfil orders from your dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/seller/register"
                className="bg-[#7C9CFF] text-[#0B0F10] font-semibold px-5 py-2.5 rounded-md hover:bg-[#93AEFF] transition-colors"
              >
                Apply as a seller
              </Link>
              <Link
                to="/seller/login"
                className="text-[#EDEFEF] border border-[#212A2C] px-5 py-2.5 rounded-md hover:border-[#7C9CFF] transition-colors"
              >
                Seller login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section id="categories" title="Shop by category">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {["Phones", "Laptops", "Tablets", "Audio", "Wearables", "Gaming", "Accessories", "Smart Home"].map((category) => (
            <Link
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
              className="flex flex-col items-center justify-center gap-2 border border-[#212A2C] rounded-lg py-6 bg-[#12181A] hover:border-[#3DDC97] transition-colors"
            >
              <img
                src={`/images/products/${category.toLowerCase().replace(/\s+/g, "-")}.svg`}
                alt=""
                className="w-10 h-10"
              />
              <span className="text-xs text-[#8B9494]">{category}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="most-ordered" title="Most ordered" linkTo="/products?sort=top_sellers">
        {renderGrid(top, loadingTop)}
      </Section>

      <Section id="new-arrivals" title="New arrivals" linkTo="/products?sort=newest">
        {renderGrid(latest, loadingLatest)}
      </Section>

      <Footer />
    </div>
  );
};

export default Home;
