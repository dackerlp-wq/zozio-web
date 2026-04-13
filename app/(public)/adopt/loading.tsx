function SkeletonAnimalCard() {
  return (
    <div className="bg-warm rounded-lg overflow-hidden border border-border animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-[4/3] bg-border" />
      {/* Card body */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-border rounded-full w-3/4" />
        <div className="h-3 bg-border rounded-full w-1/2" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 bg-border rounded-full w-14" />
          <div className="h-5 bg-border rounded-full w-12" />
        </div>
      </div>
    </div>
  )
}

function SkeletonFilterPanel() {
  return (
    <div className="w-full lg:w-64 flex-shrink-0 animate-pulse">
      {/* Filter header */}
      <div className="h-5 bg-border rounded-full w-24 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-border rounded-lg w-full" />
        ))}
      </div>
    </div>
  )
}

export default function AdoptLoading() {
  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-warm">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-16">
        {/* Page header skeleton */}
        <div className="py-8 md:py-10 animate-pulse">
          <div className="h-9 bg-border rounded-full w-52 mb-2" />
          <div className="h-4 bg-border rounded-full w-36" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Filter sidebar skeleton */}
          <SkeletonFilterPanel />

          {/* Results area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar skeleton */}
            <div className="flex items-center justify-between mb-5 animate-pulse">
              <div className="h-4 bg-border rounded-full w-28" />
              <div className="h-9 bg-border rounded-lg w-36" />
            </div>

            {/* Animal card grid — 6 cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonAnimalCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
