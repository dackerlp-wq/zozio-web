export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 bg-[#F0EDE8] rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="h-16 bg-[#F0EDE8] rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-[#F0EDE8] rounded-xl" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-24 bg-[#F0EDE8] rounded-2xl" />
          <div className="h-48 bg-[#F0EDE8] rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
