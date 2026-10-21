import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginBuyer } from "../../api/authAPI";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/auth/InputField";
import { validateLogin, isValid } from "../../utils/validation";

/**
 * Buyer login.
 *
 * Validation runs in the browser for immediate feedback, but the server is what actually
 * decides whether the credentials are right - and whether this account is allowed through
 * the buyer door at all. A seller signing in here is refused by the server with a message
 * pointing them at the seller login, rather than being let into a session whose role does
 * not match the page.
 */
const Login = () => {
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
      const data = await loginBuyer({ email: form.email.trim(), password: form.password });
      login(data);
      navigate("/");
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
          <line x1="0" y1="120" x2="600" y2="120" stroke="#212A2C" strokeWidth="1" />
          <line x1="0" y1="400" x2="600" y2="400" stroke="#212A2C" strokeWidth="1" />
          <line x1="0" y1="680" x2="600" y2="680" stroke="#212A2C" strokeWidth="1" />
          <line x1="150" y1="0" x2="150" y2="800" stroke="#212A2C" strokeWidth="1" />
          <line x1="450" y1="0" x2="450" y2="800" stroke="#212A2C" strokeWidth="1" />
          <circle cx="150" cy="120" r="4" fill="#3DDC97" />
          <circle cx="450" cy="400" r="4" fill="#7C9CFF" />
          <circle cx="150" cy="680" r="4" fill="#3DDC97" />
          <path d="M150 120 V400 H450" stroke="#3DDC97" strokeWidth="1" opacity="0.5" />
          <path d="M450 400 V680 H150" stroke="#7C9CFF" strokeWidth="1" opacity="0.5" />
        </svg>
        <div className="relative z-10 max-w-sm px-10">
          <h1 className="font-display text-4xl font-semibold text-[#EDEFEF] leading-tight mb-4">
            Every gadget you need, one login away.
          </h1>
          <p className="text-[#8B9494] leading-relaxed">
            Track your orders, check out faster, and see live stock as it changes.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link to="/" className="font-display text-lg font-semibold text-[#EDEFEF]">GadgetHub</Link>
            <h2 className="font-display text-2xl font-semibold text-[#EDEFEF] mt-6 mb-2">Welcome back</h2>
            <p className="text-[#8B9494] text-sm">Log in to continue to your account.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {formError && (
              <div role="alert" className="mb-5 px-4 py-2.5 rounded-md bg-[#2A1414] border border-[#4A2020] text-[#E0918A] text-sm">
                {formError}
              </div>
            )}

            <InputField
              label="Email" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com"
              autoComplete="email" error={errors.email}
            />
            <InputField
              label="Password" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Your password"
              autoComplete="current-password" error={errors.password}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3DDC97] text-[#0B0F10] font-semibold py-2.5 rounded-md hover:bg-[#4FE8A5] transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-[#8B9494] text-sm text-center mt-8">
            New to GadgetHub?{" "}
            <Link to="/register" className="text-[#7C9CFF] hover:underline">Create an account</Link>
          </p>
          <p className="text-[#8B9494] text-sm text-center mt-3">
            Selling instead?{" "}
            <Link to="/seller/login" className="text-[#7C9CFF] hover:underline">Seller login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
