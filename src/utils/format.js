const ngn = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Naira, no kobo: the storefront deals in whole naira. */
export const formatPrice = (value) => ngn.format(Number(value) || 0);

/** Same, but keeping the decimals - used on receipts where the exact amount matters. */
export const formatPriceExact = (value) => {
  const amount = Number(value) || 0;
  const hasKobo = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/** Short date for order lists, e.g. "16 Oct 2026, 10:24". */
export const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Stock wording, shared by the card and the detail page so a product never appears
 * "in stock" on one screen and "only 3 left" on another.
 */
export const stockInfo = (stock, lowThreshold = 5) => {
  const count = Number(stock) || 0;
  if (count <= 0) return { label: "Out of stock", tone: "out", available: false };
  if (count <= lowThreshold) return { label: `Only ${count} left`, tone: "low", available: true };
  return { label: "In stock", tone: "in", available: true };
};

/** Order status as a label plus a colour tone. */
export const orderStatusInfo = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "placed":
      return { label: "Order placed", tone: "progress", description: "Waiting to be shipped." };
    case "shipped":
      return { label: "Shipped", tone: "progress", description: "On its way to you." };
    case "delivered":
      return { label: "Delivered", tone: "done", description: "Delivered and complete." };
    case "cancelled":
      return { label: "Cancelled", tone: "cancelled", description: "This order was cancelled." };
    default:
      return { label: status || "Unknown", tone: "progress", description: "" };
  }
};

/** Seller application status as a label plus an explanation. */
export const sellerStatusInfo = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "approved":
      return { label: "Approved", tone: "done", description: "Your store is live and you can list products." };
    case "pending":
      return { label: "Pending review", tone: "progress", description: "An administrator is reviewing your application." };
    case "rejected":
      return { label: "Not approved", tone: "cancelled", description: "Your application was not approved." };
    default:
      return { label: "Buyer account", tone: "neutral", description: "" };
  }
};

/** "1 item" / "3 items" without string-concatenation bugs. */
export const pluralise = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural || `${singular}s`}`;
