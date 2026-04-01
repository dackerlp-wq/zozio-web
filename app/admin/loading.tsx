function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border animate-pulse">
      <div className="h-4 bg-border rounded-full w-1/4" />
      <div className="h-4 bg-border rounded-full w-1/5" />
      <div className="h-4 bg-border rounded-full w-1/6" />
      <div className="h-4 bg-border rounded-full flex-1" />
      <div className="h-7 bg-border rounded-full w-20" />
    </div>
  )
}

export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Page title skeleton */}
      <div className="mb-6">
        <div className="h-7 bg-border rounded-full w-48 mb-2" />
        <div className="h-4 bg-border rounded-full w-64" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-9 bg-border rounded-lg w-56" />
        <div className="h-9 bg-border rounded-lg w-32" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl overflow-hidden border border-border bg-warm">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-pale/50 border-b border-border">
          <div className="h-3 bg-border rounded-full w-1/4" />
          <div className="h-3 bg-border rounded-full w-1/5" />
          <div className="h-3 bg-border rounded-full w-1/6" />
          <div className="h-3 bg-border rounded-full flex-1" />
          <div className="h-3 bg-border rounded-full w-20" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    </div>
  )
}
