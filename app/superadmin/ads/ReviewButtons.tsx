'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReviewButtons({ adId }: { adId: string }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const router = useRouter()

  const handleApprove = async () => {
    setLoading('approve')
    await fetch(`/api/superadmin/ads/${adId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    router.refresh()
    setLoading(null)
  }

  const handleReject = async () => {
    setLoading('reject')
    await fetch(`/api/superadmin/ads/${adId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', rejection_reason: reason || undefined }),
    })
    router.refresh()
    setLoading(null)
    setShowReject(false)
    setReason('')
  }

  if (showReject) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Důvod zamítnutí..."
          className="px-2 py-1 text-xs border rounded-lg"
          style={{ borderColor: '#E0DDD8', color: '#2C1810', minWidth: 160 }}
        />
        <button
          onClick={handleReject}
          disabled={loading === 'reject'}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border-none cursor-pointer"
          style={{ background: '#FAECE7', color: '#993C1D' }}>
          {loading === 'reject' ? '...' : 'Zamítnout'}
        </button>
        <button
          onClick={() => setShowReject(false)}
          className="px-2 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer"
          style={{ color: '#8B6550', background: '#F0EDE8' }}>
          Zrušit
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        className="px-3 py-1.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: '#EAF3DE', color: '#3B6D11' }}>
        {loading === 'approve' ? '...' : 'Schválit'}
      </button>
      <button
        onClick={() => setShowReject(true)}
        disabled={loading !== null}
        className="px-3 py-1.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: '#FAECE7', color: '#993C1D' }}>
        Zamítnout
      </button>
    </div>
  )
}
