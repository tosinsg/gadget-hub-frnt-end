import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupBuyer } from "../../api/authAPI";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/auth/InputField";
import AuthShell from "../../components/auth/AuthShell";
import { validateBuyerSignup, isValid } from "../../utils/validation";

/**
 * Buyer registration.
 *
 * The rules come from `utils/validation`, which mirrors the server's Rules class. That
 * matters: the previous version of this project had the email pattern copy-pasted into five
 * files, so they could drift apart and start rejecting different things. Here there is one
 * definition of each rule, and the server's copy is the one that decides.
 */
const BuyerRegister = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
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

    const found = validateBuyerSignup(form);
    setErrors(found);
    if (!isValid(found)) return;

    setLoading(true);
    try {
      const data = await signupBuyer({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
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
    <AuthShell
      headline="Find your next gadget."
      copy="Create a free buyer account to keep your orders in one place and check out faster."
      points={[
        "Browse phones, laptops, audio and more",
        "Live stock, so you know what is really available",
        "Order history and pay-on-delivery checkout",
      ]}
      title="Create your buyer account"
      subtitle="It only takes a minute."
    >
      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div role="alert" className="mb-5 px-4 py-2.5 rounded-md bg-[#2A1414] border border-[#4A2020] text-[#E0918A] text-sm">
            {formError}
          </div>
        )}
        <InputField label="Full name" name="name" value={form.name} onChange={handleChange}
          placeholder="Ada Obi" autoComplete="name" error={errors.name} />
        <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange}
          placeholder="you@example.com" autoComplete="email" error={errors.email} />
        <InputField label="Password" name="password" type="password" value={form.password}
          onChange={handleChange} placeholder="At least 8 characters" autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number or symbol." error={errors.password} />
        <InputField label="Confirm password" name="confirm" type="password" value={form.confirm}
          onChange={handleChange} autoComplete="new-password" error={errors.confirm} />

        <button type="submit" disabled={loading}
          className="w-full bg-[#3DDC97] text-[#0B0F10] font-semibold py-2.5 rounded-md hover:bg-[#4FE8A5] transition-colors disabled:opacity-60 mt-2">
          {loading ? "Creating account..." : "Create buyer account"}
        </button>
      </form>

      <p className="text-[#8B9494] text-sm text-center mt-8">
        Already have an account? <Link to="/login" className="text-[#7C9CFF] hover:underline">Log in</Link>
      </p>
      <p className="text-[#8B9494] text-sm text-center mt-3">
        Want to sell instead?{" "}
        <Link to="/seller/register" className="text-[#7C9CFF] hover:underline">Apply as a seller</Link>
      </p>
    </AuthShell>
  );
};

export default BuyerRegister;
