/**
 * A single statistic tile, used across the seller and admin dashboards.
 *
 * `tone` drives the colour so a warning (low stock, pending reviews) is visually distinct
 * from a neutral count without every caller re-deriving the classes.
 */
const toneClass = {
  neutral: "text-[#EDEFEF]",
  good: "text-[#3DDC97]",
  warn: "text-[#F5B14C]",
  bad: "text-[#F07178]",
  accent: "text-[#7C9CFF]",
};

const StatCard = ({ label, value, hint, tone = "neutral" }) => (
  <div className="border border-[#212A2C] rounded-lg bg-[#12181A] p-4">
    <p className="text-xs uppercase tracking-wide text-[#4A5455] mb-1.5">{label}</p>
    <p className={`font-display text-2xl font-semibold ${toneClass[tone] || toneClass.neutral}`}>{value}</p>
    {hint && <p className="text-xs text-[#8B9494] mt-1">{hint}</p>}
  </div>
);

export default StatCard;
