export default function Loading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-9 w-40 bg-[#F0EDE8] rounded-xl" />
      <div className="bg-white rounded-2xl border border-[#F0EDE8] overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[#F0EDE8] last:border-0">
            <div className="w-10 h-10 bg-[#F0EDE8] rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-[#F0EDE8] rounded w-1/3" />
              <div className="h-3 bg-[#F0EDE8] rounded w-1/5" />
            </div>
            <div className="h-6 w-20 bg-[#F0EDE8] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
