function SkeletonInfoRow() {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border animate-pulse">
      <div className="h-4 bg-border rounded-full w-1/3" />
      <div className="h-4 bg-border rounded-full w-1/2" />
    </div>
  )
}

export default function AnimalDetailLoading() {
  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-warm">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-20">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 py-5 animate-pulse">
          <div className="h-3 bg-border rounded-full w-10" />
          <div className="h-3 bg-border rounded-full w-2" />
          <div className="h-3 bg-border rounded-full w-14" />
          <div className="h-3 bg-border rounded-full w-2" />
          <div className="h-3 bg-border rounded-full w-24" />
        </div>

        {/* Main grid: left column + right action panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">

          {/* Left column */}
          <div>
            {/* Image / gallery placeholder */}
            <div className="mb-8 animate-pulse">
              <div className="w-full aspect-[4/3] bg-border rounded-2xl" />
              {/* Thumbnail strip */}
              <div className="flex gap-2 mt-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-16 h-16 bg-border rounded-lg flex-shrink-0" />
                ))}
              </div>
            </div>

            {/* Name + meta */}
            <div className="mb-8 animate-pulse">
              <div className="h-8 bg-border rounded-full w-40 mb-3" />
              <div className="flex gap-2 flex-wrap">
                <div className="h-6 bg-border rounded-full w-20" />
                <div className="h-6 bg-border rounded-full w-16" />
                <div className="h-6 bg-border rounded-full w-24" />
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 animate-pulse space-y-2">
              <div className="h-5 bg-border rounded-full w-32 mb-4" />
              <div className="h-4 bg-border rounded-full w-full" />
              <div className="h-4 bg-border rounded-full w-full" />
              <div className="h-4 bg-border rounded-full w-3/4" />
              <div className="h-4 bg-border rounded-full w-5/6" />
            </div>

            {/* Info rows */}
            <div className="mb-8">
              <div className="h-5 bg-border rounded-full w-24 mb-4 animate-pulse" />
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonInfoRow key={i} />
              ))}
            </div>
          </div>

          {/* Right column — action panel */}
          <div className="animate-pulse">
            <div className="rounded-2xl border border-border bg-warm p-6 space-y-4">
              {/* Institution info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-border rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border rounded-full w-3/4" />
                  <div className="h-3 bg-border rounded-full w-1/2" />
                </div>
              </div>

              {/* Action button */}
              <div className="h-12 bg-border rounded-full w-full" />
              <div className="h-10 bg-border rounded-full w-full" />

              {/* Info chips */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 bg-border rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
