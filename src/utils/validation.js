/**
 * Browser-side validation.
 *
 * IMPORTANT - this file is a MIRROR of the server's rules, not a replacement for them.
 *
 * The server is authoritative. Anyone can open devtools, change a value, or post to the API
 * with curl, so the only checks that actually protect the system are the ones in
 * `backend/.../util/Rules.java` and the annotations on the request DTOs. What lives here
 * exists for one reason: telling the user what is wrong immediately, without a round trip,
 * and highlighting the exact field.
 *
 * The two sets of rules are kept deliberately identical (same thresholds, same patterns) so
 * that the browser never accepts something the server will reject, and never rejects
 * something the server would accept. If you change one, change the other.
 */

// --- identity ---------------------------------------------------------------

// Rejects obvious rubbish: something@something.tld, no spaces. Not full RFC 5322.
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// Optional +, 7-15 digits, spaces/dashes/dots/parens allowed as separators.
const PHONE_REGEX = /^\+?[0-9][0-9 ()\-.]{5,24}$/;

export const NAME_MIN = 2;
export const NAME_MAX = 80;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 99;
export const PRICE_MAX = 100000000;

const WEAK_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "qwertyui",
  "qwerty123", "iloveyou", "letmein1", "admin123", "welcome1", "gadgethub",
]);

// --- primitives -------------------------------------------------------------

export const isBlank = (value) => value == null || String(value).trim() === "";

export const isValidEmail = (value) => {
  const email = String(value ?? "").trim();
  return email.length <= 254 && EMAIL_REGEX.test(email);
};

export const isValidPhone = (value) => {
  const phone = String(value ?? "").trim();
  if (!PHONE_REGEX.test(phone)) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

/**
 * Password strength. Returns null when acceptable, otherwise a message written for the
 * person typing - the same wording the server uses, so the two never disagree.
 */
export const passwordProblem = (password) => {
  if (!password) return "Password is required.";
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigitOrSymbol = /[^A-Za-z]/.test(password);
  if (!hasLetter || !hasDigitOrSymbol) {
    return "Password must include at least one letter and one number or symbol.";
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return "That password is too common. Choose something less predictable.";
  }
  return null;
};

/** Price must be positive, at most two decimals, and not absurd. */
export const priceProblem = (value) => {
  if (value === "" || value == null) return "Enter a price.";
  const price = Number(value);
  if (!Number.isFinite(price)) return "Price must be a number.";
  if (price <= 0) return "Price must be greater than zero.";
  if (price > PRICE_MAX) return "Price is unrealistically high.";
  if (Math.round(price * 100) !== price * 100) return "Price can have at most 2 decimal places.";
  return null;
};

/** Stock must be a whole number, never negative. */
export const stockProblem = (value) => {
  if (value === "" || value == null) return "Enter the available stock.";
  const stock = Number(value);
  if (!Number.isInteger(stock)) return "Stock must be a whole number.";
  if (stock < 0) return "Stock cannot be negative.";
  if (stock > 100000) return "Stock is unrealistically high.";
  return null;
};

// --- forms ------------------------------------------------------------------

/**
 * Buyer signup. Mirrors SignupRequest on the server.
 * @returns an object of field -> message; empty means valid.
 */
export const validateBuyerSignup = (form) => {
  const errors = {};
  const name = String(form.name ?? "").trim();
  if (name.length < NAME_MIN) errors.name = "Enter your full name.";
  else if (name.length > NAME_MAX) errors.name = `Name must be at most ${NAME_MAX} characters.`;
  if (!isValidEmail(form.email)) errors.email = "Enter a valid email address.";
  const problem = passwordProblem(form.password);
  if (problem) errors.password = problem;
  if (form.confirm !== form.password) errors.confirm = "Passwords don't match.";
  return errors;
};

/** Seller application. Mirrors SellerSignupRequest on the server. */
export const validateSellerSignup = (form) => {
  const errors = {};
  const name = String(form.name ?? "").trim();
  if (name.length < NAME_MIN) errors.name = "Enter your full name.";
  if (!isValidEmail(form.email)) errors.email = "Enter a valid email address.";
  const problem = passwordProblem(form.password);
  if (problem) errors.password = problem;
  if (form.confirm !== form.password) errors.confirm = "Passwords don't match.";
  if (String(form.storeName ?? "").trim().length < 2) errors.storeName = "Enter your store name.";
  if (!isValidPhone(form.storePhone)) errors.storePhone = "Enter a valid phone number (7 to 15 digits).";
  if (String(form.storeCity ?? "").trim().length < 2) errors.storeCity = "Enter your city.";
  if (!form.storeCategory) errors.storeCategory = "Choose what you mainly sell.";
  return errors;
};

/** Login. Kept minimal on purpose: the server decides whether the credentials are right. */
export const validateLogin = (form) => {
  const errors = {};
  if (!isValidEmail(form.email)) errors.email = "Enter a valid email address.";
  if (isBlank(form.password)) errors.password = "Enter your password.";
  return errors;
};

/** Checkout delivery details. Mirrors DeliveryRequest on the server. */
export const validateDelivery = (form) => {
  const errors = {};
  const name = String(form.recipientName ?? "").trim();
  if (name.length < NAME_MIN) errors.recipientName = "Enter the recipient's full name.";
  if (!isValidEmail(form.email)) errors.email = "Enter a valid email address.";
  if (!isValidPhone(form.phone)) errors.phone = "Enter a valid phone number (7 to 15 digits).";
  const address = String(form.addressLine ?? "").trim();
  if (address.length < 5) errors.addressLine = "Enter the delivery address.";
  if (String(form.city ?? "").trim().length < 2) errors.city = "Enter your city.";
  if (String(form.state ?? "").trim().length < 2) errors.state = "Enter your state.";
  return errors;
};

/** Product create/edit. Mirrors CreateRequest/UpdateRequest on the server. */
export const validateProduct = (form, { partial = false } = {}) => {
  const errors = {};
  const name = String(form.name ?? "").trim();
  if (!partial || form.name !== undefined) {
    if (name.length < 2) errors.name = "Enter the product name.";
    else if (name.length > 120) errors.name = "Product name must be at most 120 characters.";
  }
  if (!partial || form.category !== undefined) {
    if (isBlank(form.category)) errors.category = "Choose a category.";
  }
  if (!partial || form.price !== undefined) {
    const problem = priceProblem(form.price);
    if (problem) errors.price = problem;
  }
  if (!partial || form.stock !== undefined) {
    const problem = stockProblem(form.stock);
    if (problem) errors.stock = problem;
  }
  if (form.image && !/^(\/|https?:\/\/)/.test(form.image)) {
    errors.image = "Image must start with / or be a full http(s) URL.";
  }
  return errors;
};

/** True when a validation result object has no problems. */
export const isValid = (errors) => Object.keys(errors).length === 0;
