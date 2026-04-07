'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  articleId: string
  isPinned:  boolean
}

export function PinButton({ articleId, isPinned }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    if (loading) return
    if (isPinned && !confirm('Odepnout tento článek z hero sekce?')) return
    setLoading(true)
    await fetch('/api/superadmin/pin-article', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ articleId, pin: !isPinned }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all disabled:opacity-50
        ${isPinned
          ? 'border-amber text-warning bg-amber-light hover:bg-amber hover:text-white'
          : 'border-gray-pale text-gray hover:border-amber hover:text-warning bg-white'
        }`}>
      {loading ? '...' : isPinned ? '📌 Odepnout' : '📌 Připnout'}
    </button>
  )
}
