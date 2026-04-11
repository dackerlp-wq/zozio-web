'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface WorkflowActionsProps {
  animalId: string
}

export default function WorkflowActions({ animalId }: WorkflowActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(status)
    try {
      const res = await fetch(`/api/animals/${animalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adoption_status: status }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`/admin/animals/${animalId}?exit=1&type=adopted`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black text-white hover:opacity-90 transition-opacity"
          style={{ background: '#2D8A4E', textDecoration: 'none' }}
        >
          ✅ Zaznamenat adopci
        </a>
        <button
          onClick={() => updateStatus('reserved')}
          disabled={loading === 'reserved'}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black hover:border-[#E8634A] transition-colors"
          style={{ background: 'white', border: '2px solid #F0EDE8', color: '#6B4030', cursor: 'pointer', opacity: loading === 'reserved' ? 0.6 : 1 }}
        >
          {loading === 'reserved' ? '...' : '📌 Označit rezervováno'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => updateStatus('treatment')}
          disabled={loading === 'treatment'}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-black hover:border-[#E8634A] transition-colors"
          style={{ fontSize: '12px', background: 'white', border: '2px solid #F0EDE8', color: '#6B4030', cursor: 'pointer', opacity: loading === 'treatment' ? 0.6 : 1 }}
        >
          {loading === 'treatment' ? '...' : '💊 Přesunout do léčby'}
        </button>
        <a
          href={`/admin/animals/${animalId}?exit=1&type=deceased`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-black hover:border-red-300 transition-colors"
          style={{ fontSize: '12px', background: 'white', border: '2px solid #FCEBEB', color: '#D83030', textDecoration: 'none' }}
        >
          🕊️ Zaznamenat úhyn
        </a>
      </div>
    </>
  )
}
