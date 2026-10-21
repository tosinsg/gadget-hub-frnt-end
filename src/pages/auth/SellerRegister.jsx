import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupSeller } from "../../api/authAPI";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/auth/InputField";
import AuthShell from "../../components/auth/AuthShell";
import { validateSellerSignup, isValid } from "../../utils/validation";

/**
 * Seller application.
 *
 * Every field collected here is now genuinely stored and acted on. In the previous version
 * this form gathered a store name, phone, city and category, sent them to an endpoint that
 * discarded them, and then displayed "your account is pending admin approval" - a claim the
 * backend had no concept of. Now:
 *
 *  - the store details are persisted on the account,
 *  - the account is created as PENDING and cannot list products,
 *  - an administrator sees the application in a review queue and approves or rejects it,
 *  - approval flips the account to APPROVED and takes effect immediately.
 */
const SellerRegister = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    storeName: "",
    storePhone: "",
    storeCity: "",
    storeCategory: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const categories = ["Phones", "Laptops", "Tablets", "Audio", "Wearables", "Gaming", "Accessories", "Smart Home"];

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

    const found = validateSellerSignup(form);
    setErrors(found);
    if (!isValid(found)) return;

    setLoading(true);
    try {
      const data = await signupSeller({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        storeName: form.storeName.trim(),
        storePhone: form.storePhone.trim(),
        storeCity: form.storeCity.trim(),
        storeCategory: form.storeCategory,
      });
      // Sign them in so they can see their own dashboard and application status, rather
      // than being told "wait to be contacted" and left with nothing to look at.
      login(data);
      setSubmitted(true);
      setTimeout(() => navigate("/seller/dashboard"), 1800);
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      accent="#7C9CFF"
      headline="Sell your gadgets on GadgetHub."
      copy="Apply for a seller account, list your products and manage your orders."
      points={[
        "Applications are reviewed by an administrator",
        "Manage stock, prices and your listings",
        "Reach buyers browsing every category",
      ]}
      title="Apply to become a seller"
      subtitle="Tell us about you and your store."
    >
      {submitted ? (
        <div role="status" className="px-4 py-4 rounded-md bg-[#132A1F] border border-[#204A35] text-[#7FE0AE] text-sm leading-relaxed">
          <p className="font-medium mb-1">Application received</p>
          <p>
            Your account has been created and is waiting for an administrator to review it. You can list
            products as soon as it is approved. Taking you to your dashboard…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div role="alert" className="mb-5 px-4 py-2.5 rounded-md bg-[#2A1414] border border-[#4A2020] text-[#E0918A] text-sm">
              {formError}
            </div>
          )}

          <p className="text-xs uppercase tracking-wide text-[#4A5455] mb-3">Your account</p>
          <InputField label="Full name" name="name" value={form.name} onChange={handleChange}
            autoComplete="name" placeholder="Ada Obi" error={errors.name} />
          <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange}
            placeholder="store@example.com" autoComplete="email" error={errors.email} />
          <InputField label="Password" name="password" type="password" value={form.password}
            onChange={handleChange} placeholder="At least 8 characters" autoComplete="new-password"
            hint="At least 8 characters, with a letter and a number or symbol." error={errors.password} />
          <InputField label="Confirm password" name="confirm" type="password" value={form.confirm}
            onChange={handleChange} autoComplete="new-password" error={errors.confirm} />

          <p className="text-xs uppercase tracking-wide text-[#4A5455] mt-6 mb-3">Your store</p>
          <InputField label="Store name" name="storeName" value={form.storeName} onChange={handleChange}
            placeholder="Ada's Gadget Store" error={errors.storeName} />
          <InputField label="Contact phone" name="storePhone" type="tel" value={form.storePhone}
            onChange={handleChange} autoComplete="tel" placeholder="+2348012345678" error={errors.storePhone} />
          <InputField label="City" name="storeCity" value={form.storeCity} onChange={handleChange}
            autoComplete="address-level2" placeholder="Lagos" error={errors.storeCity} />

          <div className="mb-5">
            <label htmlFor="storeCategory" className="block text-sm text-[#8B9494] mb-1.5">
              What do you mainly sell?
            </label>
            <select
              id="storeCategory"
              name="storeCategory"
              value={form.storeCategory}
              onChange={handleChange}
              aria-invalid={!!errors.storeCategory}
              className={`w-full px-4 py-2.5 rounded-md bg-[#0B0F10] text-[#EDEFEF] border outline-none focus:border-[#3DDC97] ${
                errors.storeCategory ? "border-[#F07178]" : "border-[#212A2C]"
              }`}
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.storeCategory && (
              <p className="text-xs text-[#F07178] mt-1">{errors.storeCategory}</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#7C9CFF] text-[#0B0F10] font-semibold py-2.5 rounded-md hover:bg-[#93AEFF] transition-colors disabled:opacity-60 mt-2">
            {loading ? "Submitting..." : "Submit application"}
          </button>
        </form>
      )}

      <p className="text-[#8B9494] text-sm text-center mt-8">
        Already a seller? <Link to="/seller/login" className="text-[#7C9CFF] hover:underline">Seller login</Link>
      </p>
      <p className="text-[#8B9494] text-sm text-center mt-3">
        Just want to shop? <Link to="/register" className="text-[#7C9CFF] hover:underline">Create a buyer account</Link>
      </p>
    </AuthShell>
  );
};

export default SellerRegister;
