'use client'
import { useEffect, useState } from 'react'

interface ScanRedirectProps {
  animalName: string
}

export function ScanRedirect({ animalName }: ScanRedirectProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-espresso text-white px-5 py-3 rounded-pill shadow-lg font-body text-sm font-semibold"
      style={{ animation: 'fadeUp 0.3s ease both' }}>
      <span className="text-lg">▣</span>
      <span>QR sken — otevřena karta <strong>{animalName}</strong></span>
      <button
        onClick={() => setVisible(false)}
        className="ml-2 text-white/60 hover:text-white cursor-pointer bg-transparent border-none text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
