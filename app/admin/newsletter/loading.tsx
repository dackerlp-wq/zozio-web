export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-48 bg-[#F0EDE8] rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-40 bg-[#F0EDE8] rounded-2xl" />
        <div className="h-40 bg-[#F0EDE8] rounded-2xl" />
      </div>
      <div className="h-64 bg-[#F0EDE8] rounded-2xl" />
    </div>
  )
}
