import { Link } from "react-router-dom";

const linkClass = "hover:text-[#EDEFEF] transition-colors";

const Footer = () => {
  return (
    <footer className="border-t border-[#212A2C] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <span className="font-display text-lg font-semibold text-[#EDEFEF]">GadgetHub</span>
          <p className="text-[#8B9494] text-sm mt-2 max-w-xs">
            A marketplace for gadgets and accessories, built for buyers and sellers alike.
          </p>
        </div>

        <div className="flex gap-16 text-sm">
          <div>
            <h4 className="text-[#EDEFEF] font-medium mb-3">Shop</h4>
            <ul className="space-y-2 text-[#8B9494]">
              <li><Link to="/products" className={linkClass}>All products</Link></li>
              <li><Link to="/#categories" className={linkClass}>Categories</Link></li>
              <li><Link to="/cart" className={linkClass}>Your cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#EDEFEF] font-medium mb-3">Sell</h4>
            <ul className="space-y-2 text-[#8B9494]">
              <li><Link to="/seller/register" className={linkClass}>Become a seller</Link></li>
              <li><Link to="/seller/login" className={linkClass}>Seller login</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="text-center text-[#4A5455] text-xs pb-8">
        {"\u00A9"} {new Date().getFullYear()} GadgetHub. Student project, no real payments are processed.
      </div>
    </footer>
  );
};

export default Footer;
