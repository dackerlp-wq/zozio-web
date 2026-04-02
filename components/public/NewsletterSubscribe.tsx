'use client'
import { useState } from 'react'

interface NewsletterSubscribeProps {
  institutionId: string
  institutionName: string
  isShelter: boolean
}

export function NewsletterSubscribe({ institutionId, institutionName, isShelter }: NewsletterSubscribeProps) {
  const [email,   setEmail]   = useState('')
  const [name,    setName]    = useState('')
  const [state,   setState]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const color    = isShelter ? '#E8634A' : '#2E9E8F'
  const colorBg  = isShelter ? '#FAECE7' : '#E1F5EE'
  const colorDark = isShelter ? '#993C1D' : '#0F6E56'

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setState('error')
      setMessage('Zadej platný e-mail.')
      return
    }

    setState('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, name: name || undefined, institution_id: institutionId }),
      })
      if (!res.ok) throw new Error()
      setState('success')
      setMessage('Hotovo! Pošleme ti potvrzení na e-mail.')
    } catch {
      setState('error')
      setMessage('Něco se pokazilo. Zkus to znovu.')
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-2xl px-6 py-5 text-center" style={{ background: colorBg }}>
        <div className="text-3xl mb-2">📬</div>
        <p className="font-bold text-sm" style={{ color: colorDark }}>{message}</p>
        <p className="text-xs mt-1" style={{ color: colorDark, opacity: 0.75 }}>
          Sleduj novinky od {institutionName}.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 px-6 py-5" style={{ borderColor: colorBg, background: '#FFFCF8' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📬</span>
        <h3 className="font-display font-extrabold text-base" style={{ color: '#1A0F0A' }}>
          Novinky od {institutionName}
        </h3>
      </div>
      <p className="text-xs mb-4" style={{ color: '#8B6550' }}>
        Dostávej upozornění na nová zvířata, akce a příběhy. Odhlásit se lze kdykoli.
      </p>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Jméno (nepovinné)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors bg-white"
          style={{ borderColor: '#F0EDE8', color: '#1A0F0A' }}
          onFocus={e => (e.target.style.borderColor = color)}
          onBlur={e => (e.target.style.borderColor = '#F0EDE8')}
        />
        <input
          type="email"
          placeholder="Tvůj e-mail *"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full px-4 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors bg-white"
          style={{ borderColor: '#F0EDE8', color: '#1A0F0A' }}
          onFocus={e => (e.target.style.borderColor = color)}
          onBlur={e => (e.target.style.borderColor = '#F0EDE8')}
        />

        {state === 'error' && (
          <p className="text-xs font-semibold" style={{ color: colorDark }}>{message}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={state === 'loading'}
          className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-opacity disabled:opacity-60 cursor-pointer border-none"
          style={{ background: color }}
        >
          {state === 'loading' ? 'Přihlašuji…' : 'Odebírat novinky →'}
        </button>
      </div>
    </div>
  )
}
