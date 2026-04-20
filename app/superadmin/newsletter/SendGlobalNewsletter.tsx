'use client'
import { useState } from 'react'

export function SendGlobalNewsletter({ subscriberCount }: { subscriberCount: number }) {
  const [state,   setState]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [confirm, setConfirm] = useState(false)

  const handleSend = async () => {
    if (!confirm) { setConfirm(true); return }

    setState('loading')
    setConfirm(false)
    try {
      const res = await fetch('/api/newsletter/send-global', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState('success')
      setMessage(`Odesláno ${data.sent} odběratelům`)
    } catch (e: any) {
      setState('error')
      setMessage(e.message ?? 'Chyba')
    }
  }

  if (state === 'success') {
    return (
      <div className="px-5 py-2.5 rounded-lg bg-success-bg text-success text-sm font-bold">
        ✅ {message}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {confirm && (
        <span className="text-sm font-semibold text-warning">
          Odešle se {subscriberCount} lidem. Jsi si jistý?
        </span>
      )}
      {confirm && (
        <button
          onClick={() => setConfirm(false)}
          className="px-4 py-2 rounded-lg text-sm font-bold border-2 border-gray-pale text-gray cursor-pointer bg-white hover:bg-gray-pale transition-colors"
        >
          Zrušit
        </button>
      )}
      <button
        onClick={handleSend}
        disabled={state === 'loading'}
        className="px-5 py-2.5 rounded-lg font-bold text-sm text-white cursor-pointer border-none disabled:opacity-60 transition-all hover:opacity-90"
        style={{ background: confirm ? '#E8634A' : '#2C1810' }}
      >
        {state === 'loading'
          ? 'Odesílám…'
          : confirm
          ? '🚀 Potvrdit odeslání'
          : '📬 Odeslat newsletter'
        }
      </button>
      {state === 'error' && (
        <span className="text-sm font-semibold text-coral-dark">{message}</span>
      )}
    </div>
  )
}
