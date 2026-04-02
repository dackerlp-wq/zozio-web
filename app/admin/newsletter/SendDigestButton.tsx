'use client'
import { useState } from 'react'

interface Props {
  institutionId: string
  period: 'week' | 'month'
  subscriberCount: number
  label: string
}

export function SendDigestButton({ institutionId, period, subscriberCount, label }: Props) {
  const [state,   setState]   = useState<'idle' | 'confirm' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  if (subscriberCount === 0) {
    return (
      <span className="text-xs text-gray font-semibold">Žádní odběratelé</span>
    )
  }

  const handleClick = async () => {
    if (state === 'idle') { setState('confirm'); return }
    if (state === 'confirm') {
      setState('loading')
      try {
        const res = await fetch('/api/newsletter/send-digest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ institution_id: institutionId, period }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setState('success')
        setMessage(`Odesláno ${data.sent} odběratelům`)
      } catch (e: any) {
        setState('error')
        setMessage(e.message ?? 'Chyba')
        setTimeout(() => setState('idle'), 4000)
      }
    }
  }

  if (state === 'success') {
    return (
      <div className="text-sm font-bold text-success">✅ {message}</div>
    )
  }

  return (
    <div className="space-y-2">
      {state === 'confirm' && (
        <p className="text-xs font-semibold text-warning">
          Odešle se {subscriberCount} lidem. Jsi si jistý?
        </p>
      )}
      <div className="flex gap-2">
        {state === 'confirm' && (
          <button
            onClick={() => setState('idle')}
            className="px-3 py-2 rounded-lg text-xs font-bold border-2 border-gray-pale text-gray cursor-pointer bg-white hover:bg-gray-pale transition-colors"
          >
            Zrušit
          </button>
        )}
        <button
          onClick={handleClick}
          disabled={state === 'loading'}
          className="px-4 py-2 rounded-lg font-bold text-xs text-white cursor-pointer border-none disabled:opacity-60 hover:opacity-90 transition-all"
          style={{ background: state === 'confirm' ? '#E8634A' : '#2C1810' }}
        >
          {state === 'loading' ? 'Odesílám…' : state === 'confirm' ? '🚀 Potvrdit' : `📬 ${label}`}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-xs font-semibold text-coral-dark">{message}</p>
      )}
    </div>
  )
}
