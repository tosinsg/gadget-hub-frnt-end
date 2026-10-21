const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" aria-busy="true" aria-label="Loading products">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border border-[#212A2C] rounded-lg overflow-hidden bg-[#12181A] animate-pulse">
        <div className="aspect-[4/3] bg-[#1A2224]" />
        <div className="p-4 space-y-2">
          <div className="h-3 bg-[#1A2224] rounded w-1/2" />
          <div className="h-4 bg-[#1A2224] rounded w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

export default ProductGridSkeleton;
