export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[#F0EDE8] rounded-2xl" />
        ))}
      </div>
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="h-72 bg-[#F0EDE8] rounded-2xl" />
        <div className="h-72 bg-[#F0EDE8] rounded-2xl" />
      </div>
    </div>
  )
}
