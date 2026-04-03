export default function Loading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex justify-between">
        <div className="h-9 w-32 bg-[#F0EDE8] rounded-xl" />
        <div className="h-9 w-36 bg-[#F0EDE8] rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-[#F0EDE8] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
