import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLive } from "../../context/LiveContext";

const navLinkClass = ({ isActive }) =>
  `hover:text-[#EDEFEF] transition-colors ${isActive ? "text-[#EDEFEF]" : "text-[#8B9494]"}`;

/**
 * Top navigation.
 *
 * The links shown depend on the signed-in role, which is a courtesy rather than a control: a
 * buyer who types /admin is redirected, and even if they got past that the server would
 * refuse every request. The point is simply not to offer people doors that will not open.
 */
const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { isLive } = useLive();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0F10]/90 backdrop-blur border-b border-[#212A2C]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" onClick={close} className="font-display text-lg font-semibold text-[#EDEFEF] flex items-center gap-2">
          GadgetHub
          {isLive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]" title="Live updates connected" aria-hidden="true" />
          )}
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm">
          <NavLink to="/products" end className={navLinkClass}>Shop</NavLink>
          <Link to="/#categories" className="text-[#8B9494] hover:text-[#EDEFEF] transition-colors">Categories</Link>
          {user && <NavLink to="/orders" className={navLinkClass}>My orders</NavLink>}
          {user?.role === "seller" && (
            <NavLink to="/seller/dashboard" className={navLinkClass}>Seller dashboard</NavLink>
          )}
          {isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
          {!user && <NavLink to="/seller/register" className={navLinkClass}>Sell on GadgetHub</NavLink>}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/cart"
            aria-label={`Cart, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
            className="relative text-sm text-[#EDEFEF] border border-[#212A2C] rounded-md px-3 py-2 hover:border-[#3DDC97] transition-colors"
          >
            Cart
            {totalItems > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#3DDC97] text-[#0B0F10] text-xs font-semibold">
                {totalItems}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-[#8B9494] hidden lg:inline">
                  Hi, {String(user.name || "").split(" ")[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-[#EDEFEF] border border-[#212A2C] rounded-md px-4 py-2 hover:border-[#3DDC97] transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-[#EDEFEF] hover:text-[#3DDC97] transition-colors">Log in</Link>
                <Link
                  to="/register"
                  className="text-sm bg-[#3DDC97] text-[#0B0F10] font-semibold rounded-md px-4 py-2 hover:bg-[#4FE8A5] transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-[#EDEFEF] border border-[#212A2C] rounded-md px-3 py-2 text-sm"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-[#212A2C] px-6 py-4 flex flex-col gap-4 text-sm text-[#EDEFEF]">
          <Link to="/products" onClick={close}>Shop</Link>
          <Link to="/#categories" onClick={close}>Categories</Link>
          {user && <Link to="/orders" onClick={close}>My orders</Link>}
          {user?.role === "seller" && <Link to="/seller/dashboard" onClick={close}>Seller dashboard</Link>}
          {isAdmin && <Link to="/admin" onClick={close}>Admin</Link>}
          {!user && <Link to="/seller/register" onClick={close}>Sell on GadgetHub</Link>}
          {user ? (
            <button onClick={() => { logout(); close(); }} className="text-left">
              Log out ({String(user.name || "").split(" ")[0]})
            </button>
          ) : (
            <>
              <Link to="/login" onClick={close}>Log in</Link>
              <Link to="/register" onClick={close}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
