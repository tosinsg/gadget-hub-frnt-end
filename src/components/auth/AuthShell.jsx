import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Shared two-column layout for the register pages. `accent` tints the side panel per role.
const AuthShell = ({ accent = "#3DDC97", headline, copy, points = [], title, subtitle, children }) => (
  <div className="min-h-screen flex bg-[#0B0F10]">
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center border-r border-[#212A2C]">
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 600 800" fill="none" aria-hidden="true">
        <line x1="0" y1="120" x2="600" y2="120" stroke="#212A2C" />
        <line x1="0" y1="400" x2="600" y2="400" stroke="#212A2C" />
        <line x1="0" y1="680" x2="600" y2="680" stroke="#212A2C" />
        <line x1="150" y1="0" x2="150" y2="800" stroke="#212A2C" />
        <line x1="450" y1="0" x2="450" y2="800" stroke="#212A2C" />
        <circle cx="150" cy="120" r="4" fill={accent} />
        <circle cx="450" cy="400" r="4" fill="#7C9CFF" />
        <circle cx="150" cy="680" r="4" fill={accent} />
        <path d="M150 120 V400 H450" stroke={accent} opacity="0.5" />
        <path d="M450 400 V680 H150" stroke="#7C9CFF" opacity="0.5" />
      </svg>
      <div className="relative z-10 max-w-sm px-10">
        <h1 className="font-display text-4xl font-semibold text-[#EDEFEF] leading-tight mb-4">{headline}</h1>
        <p className="text-[#8B9494] leading-relaxed mb-8">{copy}</p>
        <ul className="space-y-3">
          {points.map((p) => (
            <li key={p} className="flex gap-3 text-sm text-[#EDEFEF]">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-8">
          <Link to="/" className="font-display text-lg font-semibold text-[#EDEFEF]">GadgetHub</Link>
          <h2 className="font-display text-2xl font-semibold text-[#EDEFEF] mt-6 mb-2">{title}</h2>
          <p className="text-[#8B9494] text-sm">{subtitle}</p>
        </div>
        {children}
      </motion.div>
    </div>
  </div>
);

export default AuthShell;
