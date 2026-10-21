import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/product/ProductCard";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import LiveBadge from "../components/layout/LiveBadge";
import { getProducts, getCategories } from "../api/productAPI";
import { useLive } from "../context/LiveContext";
import { useCart } from "../context/CartContext";

/**
 * Product listing with filters, sorting and pagination.
 *
 * Filtering, sorting and paging are done by MongoDB, not in the browser: the query goes to
 * the server and comes back as one page. The previous version fetched the whole collection
 * and filtered it in JavaScript, which is fine for six rows and quietly wrong for a real
 * catalogue.
 *
 * The search box is debounced, so typing does not fire a request per keystroke, and the grid
 * refreshes when the server pushes a stock change.
 */
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "top_sellers", label: "Most ordered" },
];

const inputClass =
  "px-3 py-2 rounded-md bg-[#12181A] text-[#EDEFEF] border border-[#212A2C] placeholder:text-[#4A5455] outline-none focus:border-[#3DDC97] text-sm";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const page = parseInt(searchParams.get("page"), 10) || 1;

  const { syncWithProducts } = useCart();
  const { status: liveStatus, lastEventAt, productTick } = useLive();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState(search);
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);

  // Track the URL as the source of truth, and treat the inputs as local drafts. When the
  // URL changes underneath us (back button, "clear filters"), re-seed the drafts during
  // render rather than in an effect - React's recommended pattern, and it avoids the extra
  // render pass that setting state inside an effect would cause.
  const [seededFrom, setSeededFrom] = useState({ search, minPrice, maxPrice });
  if (seededFrom.search !== search || seededFrom.minPrice !== minPrice || seededFrom.maxPrice !== maxPrice) {
    setSeededFrom({ search, minPrice, maxPrice });
    setSearchInput(search);
    setMinInput(minPrice);
    setMaxInput(maxPrice);
  }

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        /* the filter chips just won't render; the grid still works */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      // Any filter change resets to page 1, otherwise you can land on an empty page.
      if (!("page" in updates)) next.delete("page");
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  // Debounce the search box so each keystroke does not hit the API.
  useEffect(() => {
    if (searchInput.trim() === search) return undefined;
    const timer = setTimeout(() => {
      updateParams({ search: searchInput.trim() });
    }, 450);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getProducts({
          page,
          limit: 12,
          category,
          search,
          sort,
          minPrice,
          maxPrice,
        });
        if (cancelled) return;
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotalProducts(data.totalProducts);
        // Keep the cart's prices and stock levels aligned with what the shop actually has.
        syncWithProducts(data.products);
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
    // productTick re-runs this when the server pushes a stock change.
  }, [page, category, search, sort, minPrice, maxPrice, reloadKey, productTick, syncWithProducts]);

  const applyFilters = (event) => {
    event.preventDefault();
    updateParams({ search: searchInput.trim(), minPrice: minInput, maxPrice: maxInput });
  };

  const clearFilters = () => {
    setSearchInput("");
    setMinInput("");
    setMaxInput("");
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = Boolean(category || search || minPrice || maxPrice || sort !== "newest");

  return (
    <div className="min-h-screen bg-[#0B0F10]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[#EDEFEF] mb-1">
              {category || "All products"}
            </h1>
            <p className="text-[#8B9494] text-sm" aria-live="polite">
              {loading ? "Loading…" : error ? "" : `${totalProducts.toLocaleString()} products`}
            </p>
          </div>
          <LiveBadge status={liveStatus} lastEventAt={lastEventAt} />
        </div>

        <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] items-end mb-6">
          <div>
            <label htmlFor="search" className="block text-xs text-[#8B9494] mb-1">Search name or brand</label>
            <input
              id="search" type="search" value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="e.g. Samsung, headphones"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label htmlFor="minPrice" className="block text-xs text-[#8B9494] mb-1">Min price (₦)</label>
            <input id="minPrice" type="number" min="0" inputMode="numeric" value={minInput}
              onChange={(event) => setMinInput(event.target.value)} className={`${inputClass} w-full md:w-32`} />
          </div>
          <div>
            <label htmlFor="maxPrice" className="block text-xs text-[#8B9494] mb-1">Max price (₦)</label>
            <input id="maxPrice" type="number" min="0" inputMode="numeric" value={maxInput}
              onChange={(event) => setMaxInput(event.target.value)} className={`${inputClass} w-full md:w-32`} />
          </div>
          <div>
            <label htmlFor="sort" className="block text-xs text-[#8B9494] mb-1">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={(event) =>
                updateParams({ sort: event.target.value === "newest" ? "" : event.target.value })
              }
              className={`${inputClass} w-full`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button type="submit"
            className="px-4 py-2 rounded-md bg-[#3DDC97] text-[#0B0F10] font-semibold hover:bg-[#4FE8A5] transition-colors text-sm">
            Apply
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mb-10">
          {["", ...categories].map((item) => (
            <button
              key={item || "all"}
              onClick={() => updateParams({ category: item })}
              aria-pressed={category === item}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                category === item
                  ? "bg-[#3DDC97] text-[#0B0F10] border-[#3DDC97]"
                  : "border-[#212A2C] text-[#8B9494] hover:border-[#3DDC97]"
              }`}
            >
              {item || "All"}
            </button>
          ))}
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-1.5 text-sm text-[#7C9CFF] hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <ProductGridSkeleton count={12} />
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-[#F07178] mb-4">{error}</p>
            <button
              onClick={() => setReloadKey((key) => key + 1)}
              className="px-4 py-2 rounded-md border border-[#212A2C] text-[#EDEFEF] hover:border-[#3DDC97] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#8B9494] mb-4">No products match those filters.</p>
            <button onClick={clearFilters} className="text-[#3DDC97] hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
              disabled={page === 1}
              className="px-4 py-2 rounded-md border border-[#212A2C] text-[#EDEFEF] text-sm disabled:opacity-40 hover:border-[#3DDC97] transition-colors"
            >
              Previous
            </button>
            <span className="text-[#8B9494] text-sm px-4">Page {page} of {totalPages}</span>
            <button
              onClick={() => updateParams({ page: String(Math.min(totalPages, page + 1)) })}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-md border border-[#212A2C] text-[#EDEFEF] text-sm disabled:opacity-40 hover:border-[#3DDC97] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Products;
