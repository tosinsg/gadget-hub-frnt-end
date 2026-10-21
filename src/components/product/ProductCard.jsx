import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { formatPrice, stockInfo } from "../../utils/format";
import { useLive } from "../../context/LiveContext";
import { LOW_STOCK_THRESHOLD } from "../../config";

const toneClass = {
  in: "text-[#3DDC97]",
  low: "text-[#F5B14C]",
  out: "text-[#F07178]",
};

/**
 * One product tile.
 *
 * The stock figure prefers the live value from the event stream over whatever the page loaded
 * with, so a tile showing "Only 2 left" corrects itself the moment someone buys one - without
 * a reload, and without the customer finding out at checkout.
 *
 * There is no star rating here. The previous version rendered stars from a `rating` field
 * that actually held units sold, gated on a review count that was always zero, so the stars
 * never appeared at all. Rather than fake a review system, the card shows what is real.
 */
const ProductCard = ({ product }) => {
  const { stockOf } = useLive();
  const liveStock = stockOf(product.id);
  const stockValue = liveStock === undefined ? product.stock : liveStock;
  const stock = stockInfo(stockValue, LOW_STOCK_THRESHOLD);

  return (
    <Link
      to={`/products/${product.id}`}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC97] rounded-lg"
    >
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        className="border border-[#212A2C] rounded-lg overflow-hidden bg-[#12181A] h-full flex flex-col"
      >
        <div className="aspect-[4/3] bg-[#0B0F10] overflow-hidden">
          <ProductImage
            src={product.image}
            alt={product.name}
            name={product.name}
            className="w-full h-full object-contain p-4"
          />
        </div>
        <div className="p-3 flex flex-col flex-1">
          <p className="text-[10px] uppercase tracking-wide text-[#8B9494] mb-0.5">
            {product.brand ? `${product.brand} · ` : ""}
            {product.category}
          </p>
          <p className="text-[#EDEFEF] text-sm font-medium mb-1.5 line-clamp-2">{product.name}</p>
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <p className="text-[#3DDC97] font-semibold text-sm">{formatPrice(product.price)}</p>
              {product.unitsSold > 0 && (
                <p className="text-xs text-[#8B9494]">{product.unitsSold} sold</p>
              )}
            </div>
            <p className={`text-xs mt-1 ${toneClass[stock.tone]}`}>{stock.label}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;
