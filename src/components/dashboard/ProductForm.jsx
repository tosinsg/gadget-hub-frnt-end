import { useState } from "react";
import { createProduct, updateProduct } from "../../api/productAPI";
import { validateProduct, isValid } from "../../utils/validation";

/**
 * Create/edit form for a listing.
 *
 * It validates before submitting for fast feedback - but every rule here is also enforced
 * by the server, and the server's answer wins. If the two ever disagree, the `fieldErrors`
 * map from the API response is merged into the local errors, so the user still sees the
 * message next to the right input.
 */
const CATEGORIES = [
  "Phones",
  "Laptops",
  "Tablets",
  "Audio",
  "Wearables",
  "Gaming",
  "Accessories",
  "Smart Home",
];

const inputClass = (hasError) =>
  `w-full px-3 py-2 rounded-md bg-[#0B0F10] text-[#EDEFEF] border outline-none transition-colors focus:border-[#3DDC97] ${
    hasError ? "border-[#F07178]" : "border-[#212A2C]"
  }`;

const ProductForm = ({ product, onCancel, onSaved }) => {
  const isEdit = Boolean(product);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    price: product?.price != null ? String(product.price) : "",
    stock: product?.stock != null ? String(product.stock) : "",
    image: product?.image ?? "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    // Clear the error for this field as soon as the user starts fixing it.
    setErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const found = validateProduct(form);
    setErrors(found);
    if (!isValid(found)) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image.trim() || null,
    };

    try {
      if (isEdit) {
        await updateProduct(product.id, payload);
        onSaved(`"${payload.name}" was updated.`);
      } else {
        await createProduct(payload);
        onSaved(`"${payload.name}" is now listed in the shop.`);
      }
    } catch (err) {
      // Merge server-side field messages over the local ones so the precise input is flagged.
      if (err.fieldErrors) setErrors(err.fieldErrors);
      setSubmitError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border border-[#212A2C] rounded-lg bg-[#12181A] p-5 mb-6"
    >
      <h3 className="font-display text-lg font-semibold text-[#EDEFEF] mb-4">
        {isEdit ? `Edit "${product.name}"` : "New product"}
      </h3>

      {submitError && (
        <div role="alert" className="mb-4 px-4 py-2.5 rounded-md bg-[#2A1414] border border-[#4A2020] text-[#E0918A] text-sm">
          {submitError}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm text-[#8B9494] mb-1.5">Product name</label>
          <input
            id="name" name="name" value={form.name} onChange={handleChange}
            placeholder="e.g. iPhone 15 128GB"
            aria-invalid={!!errors.name}
            className={inputClass(errors.name)}
          />
          {errors.name && <p className="text-xs text-[#F07178] mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="brand" className="block text-sm text-[#8B9494] mb-1.5">Brand</label>
          <input id="brand" name="brand" value={form.brand} onChange={handleChange} placeholder="Apple"
            className={inputClass(errors.brand)} />
          {errors.brand && <p className="text-xs text-[#F07178] mt-1">{errors.brand}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm text-[#8B9494] mb-1.5">Category</label>
          <select id="category" name="category" value={form.category} onChange={handleChange}
            aria-invalid={!!errors.category} className={inputClass(errors.category)}>
            <option value="">Choose a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-[#F07178] mt-1">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm text-[#8B9494] mb-1.5">Price (₦)</label>
          <input id="price" name="price" type="number" min="0" step="0.01" inputMode="decimal"
            value={form.price} onChange={handleChange} placeholder="899000"
            aria-invalid={!!errors.price} className={inputClass(errors.price)} />
          {errors.price && <p className="text-xs text-[#F07178] mt-1">{errors.price}</p>}
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm text-[#8B9494] mb-1.5">Stock available</label>
          <input id="stock" name="stock" type="number" min="0" step="1" inputMode="numeric"
            value={form.stock} onChange={handleChange} placeholder="10"
            aria-invalid={!!errors.stock} className={inputClass(errors.stock)} />
          {errors.stock && <p className="text-xs text-[#F07178] mt-1">{errors.stock}</p>}
          {isEdit && (
            <p className="text-xs text-[#4A5455] mt-1">
              Stock can't go below what's already committed to open orders.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="image" className="block text-sm text-[#8B9494] mb-1.5">
            Image path or URL <span className="text-[#4A5455]">(optional)</span>
          </label>
          <input id="image" name="image" value={form.image} onChange={handleChange}
            placeholder="/images/products/phones.svg or https://…"
            aria-invalid={!!errors.image} className={inputClass(errors.image)} />
          {errors.image && <p className="text-xs text-[#F07178] mt-1">{errors.image}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm text-[#8B9494] mb-1.5">Description</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange}
            rows={3} placeholder="What makes this worth buying?"
            className={`${inputClass(errors.description)} resize-y`} />
          {errors.description && <p className="text-xs text-[#F07178] mt-1">{errors.description}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-5">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#3DDC97] text-[#0B0F10] font-semibold px-5 py-2 rounded-md hover:bg-[#4FE8A5] transition-colors text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : isEdit ? "Save changes" : "List product"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[#8B9494] hover:text-[#EDEFEF] px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
