export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 max-w-2xl">
      <div className="h-9 w-40 bg-[#F0EDE8] rounded-xl" />
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 bg-[#F0EDE8] rounded" />
            <div className="h-11 bg-[#F0EDE8] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
