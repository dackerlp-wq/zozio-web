function SkeletonCard() {
  return (
    <div className="bg-warm rounded-lg overflow-hidden border border-border animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-[4/3] bg-border" />
      {/* Text lines */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-border rounded-full w-3/4" />
        <div className="h-3 bg-border rounded-full w-1/2" />
        <div className="h-3 bg-border rounded-full w-2/3" />
      </div>
    </div>
  )
}

export default function PublicLoading() {
  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16 bg-warm">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        {/* Page title skeleton */}
        <div className="py-8 md:py-10 animate-pulse">
          <div className="h-8 bg-border rounded-full w-56 mb-3" />
          <div className="h-4 bg-border rounded-full w-36" />
        </div>

        {/* 3-column card grid, 6 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </main>
  )
}
