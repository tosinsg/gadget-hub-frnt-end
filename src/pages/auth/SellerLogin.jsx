import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSeller } from "../../api/authAPI";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/auth/InputField";
import { validateLogin, isValid } from "../../utils/validation";

/**
 * Seller login.
 *
 * The previous version gated on `data.user.sellerStatus`, a field the backend never sent, so
 * the check was dead code and a pending applicant slipped straight through. Now the status
 * comes from the server and the account holder is taken to their dashboard either way:
 *
 *  - APPROVED -> straight into the listing tools,
 *  - PENDING  -> the dashboard, which explains what is being reviewed,
 *  - REJECTED -> the dashboard, which explains the outcome and any note.
 *
 * Letting a pending seller sign in is deliberate: they need to be able to see their own
 * application status, and refusing the login would leave them with no way to find out what
 * happened. What they cannot do is list products - enforced by the server on every
 * product-writing request, not by which page they are allowed to open.
 */
const SellerLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    setFormError("");

    const found = validateLogin(form);
    setErrors(found);
    if (!isValid(found)) return;

    setLoading(true);
    try {
      const data = await loginSeller({ email: form.email.trim(), password: form.password });
      login(data);
      navigate("/seller/dashboard");
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0F10]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center border-r border-[#212A2C]">
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 600 800" fill="none" aria-hidden="true">
          <line x1="0" y1="160" x2="600" y2="160" stroke="#212A2C" strokeWidth="1" />
          <line x1="0" y1="420" x2="600" y2="420" stroke="#212A2C" strokeWidth="1" />
          <line x1="0" y1="640" x2="600" y2="640" stroke="#212A2C" strokeWidth="1" />
          <line x1="200" y1="0" x2="200" y2="800" stroke="#212A2C" strokeWidth="1" />
          <line x1="420" y1="0" x2="420" y2="800" stroke="#212A2C" strokeWidth="1" />
          <circle cx="200" cy="160" r="4" fill="#7C9CFF" />
          <circle cx="420" cy="420" r="4" fill="#3DDC97" />
          <circle cx="200" cy="640" r="4" fill="#7C9CFF" />
          <path d="M200 160 V420 H420" stroke="#7C9CFF" strokeWidth="1" opacity="0.5" />
          <path d="M420 420 V640 H200" stroke="#3DDC97" strokeWidth="1" opacity="0.5" />
        </svg>
        <div className="relative z-10 max-w-sm px-10">
          <span className="inline-block px-3 py-1 rounded-full border border-[#212A2C] text-[#7C9CFF] text-xs font-medium mb-6">
            Seller Portal
          </span>
          <h1 className="font-display text-4xl font-semibold text-[#EDEFEF] leading-tight mb-4">
            Your storefront, always open.
          </h1>
          <p className="text-[#8B9494] leading-relaxed">
            List products, manage stock, and move orders from placed to delivered.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link to="/" className="font-display text-lg font-semibold text-[#EDEFEF]">GadgetHub</Link>
            <span className="ml-2 text-xs text-[#7C9CFF] align-middle">Seller</span>
            <h2 className="font-display text-2xl font-semibold text-[#EDEFEF] mt-6 mb-2">Log in to your store</h2>
            <p className="text-[#8B9494] text-sm">Access your listings, stock and orders.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {formError && (
              <div role="alert" className="mb-5 px-4 py-2.5 rounded-md bg-[#2A1414] border border-[#4A2020] text-[#E0918A] text-sm">
                {formError}
              </div>
            )}

            <InputField label="Email" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@yourstore.com"
              autoComplete="email" error={errors.email} />
            <InputField label="Password" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Your password"
              autoComplete="current-password" error={errors.password} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3DDC97] text-[#0B0F10] font-semibold py-2.5 rounded-md hover:bg-[#4FE8A5] transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-[#8B9494] text-sm text-center mt-8">
            New seller?{" "}
            <Link to="/seller/register" className="text-[#7C9CFF] hover:underline">
              Apply to sell on GadgetHub
            </Link>
          </p>
          <p className="text-[#8B9494] text-sm text-center mt-2">
            Shopping instead?{" "}
            <Link to="/login" className="text-[#7C9CFF] hover:underline">Go to buyer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;
