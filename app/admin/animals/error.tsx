'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="font-display font-bold text-xl text-[#1A0F0A] mb-2">Nepodařilo se načíst data</h2>
      <p className="text-sm mb-6" style={{ color: '#8B6550' }}>{error.message}</p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-full font-bold text-sm text-white cursor-pointer border-none"
        style={{ background: '#E8634A' }}
      >
        Zkusit znovu
      </button>
    </div>
  )
}
