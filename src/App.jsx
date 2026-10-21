import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LiveProvider } from "./context/LiveContext";
import ScrollManager from "./components/layout/ScrollManager";
import RequireRole from "./components/layout/RequireRole";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import BuyerRegister from "./pages/auth/BuyerRegister";
import SellerRegister from "./pages/auth/SellerRegister";
import SellerLogin from "./pages/auth/SellerLogin";
import Products from "./pages/Products";
import ProductDetail from "./pages/shop/ProductDetail";
import Cart from "./pages/shop/Cart";
import Checkout from "./pages/shop/Checkout";
import OrderSuccess from "./pages/shop/OrderSuccess";
import Orders from "./pages/shop/Orders";
import OrderDetail from "./pages/shop/OrderDetail";
import SellerDashboard from "./pages/seller/SellerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

/**
 * Application shell and routes.
 *
 * Provider order matters: LiveProvider sits above the pages so every screen can subscribe to
 * server-pushed updates, and AuthProvider sits above it because the live channel and the HTTP
 * layer both need to know about the session.
 *
 * The seller and admin routes are wrapped in RequireRole. That is a convenience for the user -
 * it avoids showing a buyer a dashboard that would only error - NOT a security boundary. The
 * server independently authorises every /api/seller and /api/admin request.
 */
function App() {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      <AuthProvider>
        <LiveProvider>
          <CartProvider>
            <BrowserRouter>
              <ScrollManager />
              <Routes>
                {/* storefront */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />

                {/* buyer account */}
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />

                {/* authentication */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<BuyerRegister />} />
                <Route path="/signup" element={<Navigate to="/register" replace />} />
                <Route path="/seller/login" element={<SellerLogin />} />
                <Route path="/seller/register" element={<SellerRegister />} />
                <Route path="/seller/signup" element={<Navigate to="/seller/register" replace />} />

                {/* seller area */}
                <Route
                  path="/seller/dashboard"
                  element={
                    <RequireRole roles={["seller", "admin"]}>
                      <SellerDashboard />
                    </RequireRole>
                  }
                />

                {/* admin area */}
                <Route
                  path="/admin"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminDashboard />
                    </RequireRole>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </LiveProvider>
      </AuthProvider>
    </ReactLenis>
  );
}

export default App;
