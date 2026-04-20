'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SubmitAdButton({ adId }: { adId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    setLoading(true)
    const res = await fetch(`/api/portal/ads/${adId}/submit`, { method: 'POST' })
    if (res.ok) {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none transition-all hover:opacity-90 disabled:opacity-60"
      style={{ background: '#E8634A', color: 'white' }}>
      {loading ? 'Odesílám...' : 'Odeslat ke schválení'}
    </button>
  )
}
