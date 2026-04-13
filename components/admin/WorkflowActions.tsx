'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface WorkflowActionsProps {
  animalId: string
}

export default function WorkflowActions({ animalId }: WorkflowActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(status)
    setError(null)
    try {
      const res = await fetch(`/api/animals/${animalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adoption_status: status }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setError(body.error ?? `Chyba ${res.status}`)
      }
    } catch {
      setError('Síťová chyba – zkuste znovu')
    } finally {
      setLoading(null)
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    reserved:       '📌 Označit rezervováno',
    treatment:      '💊 Přesunout do léčby',
    rehabilitation: '🏥 Rehabilitace',
    foster:         '🏠 Dočasná péče',
  }

  return (
    <>
      {error && (
        <div
          className="text-xs font-black rounded-lg mb-2 px-3 py-2"
          style={{ background: '#FCEBEB', color: '#D83030', border: '1px solid #f9c4c4' }}
        >
          ❌ {error}
        </div>
      )}
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
          disabled={!!loading}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-colors"
          style={{ background: 'white', border: '2px solid #F0EDE8', color: '#6B4030', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading === 'reserved' ? '⏳ Ukládám…' : STATUS_LABELS.reserved}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => updateStatus('treatment')}
          disabled={!!loading}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-black transition-colors"
          style={{ fontSize: '12px', background: 'white', border: '2px solid #F0EDE8', color: '#6B4030', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading === 'treatment' ? '⏳ Ukládám…' : STATUS_LABELS.treatment}
        </button>
        <a
          href={`/admin/animals/${animalId}?exit=1&type=deceased`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-black hover:opacity-80 transition-opacity"
          style={{ fontSize: '12px', background: 'white', border: '2px solid #FCEBEB', color: '#D83030', textDecoration: 'none' }}
        >
          🕊️ Zaznamenat úhyn
        </a>
      </div>
    </>
  )
}
