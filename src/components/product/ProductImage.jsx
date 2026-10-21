import { useState } from "react";

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const ProductImage = ({ src, alt, name, className = "" }) => {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-[#12181A] text-[#3DDC97] font-display font-semibold text-3xl ${className}`}
      >
        {initials(name || alt)}
      </div>
    );
  }

  return <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} className={className} />;
};

export default ProductImage;
