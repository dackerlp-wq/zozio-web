'use client'
import { useState } from 'react'

const CATEGORIES = [
  'Technický problém',
  'Otázka k funkci',
  'Žádost o novou funkci',
  'Billing / předplatné',
  'Nastavení instituce',
  'Jiné',
]

export function SupportTicketForm() {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [subject,  setSubject]  = useState('')
  const [message,  setMessage]  = useState('')
  const [status,   setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error,    setError]    = useState<string | null>(null)

  const send = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Vyplňte předmět i zprávu.')
      return
    }
    setStatus('sending')
    setError(null)
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, category }),
      })
      if (res.ok) {
        setStatus('sent')
        setSubject('')
        setMessage('')
      } else {
        const d = await res.json()
        setError(d.error ?? 'Chyba při odesílání')
        setStatus('error')
      }
    } catch {
      setError('Síťová chyba')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0] p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-display font-extrabold text-lg text-espresso mb-1">Zpráva odeslána</h3>
        <p className="text-sm text-[#8B6550]">Odpovíme vám co nejdříve na váš e-mail.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm font-bold text-[#E8634A] bg-transparent border-none cursor-pointer hover:underline"
        >
          Odeslat další zprávu
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Kategorie */}
      <div>
        <label className="block text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1.5">
          Kategorie
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                category === c
                  ? 'border-[#E8634A] bg-[#FAECE7] text-[#E8634A]'
                  : 'border-[#F0EDE8] bg-white text-[#8B6550] hover:border-[#E8634A]/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Předmět */}
      <div>
        <label className="block text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1.5">
          Předmět
        </label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Stručně popište problém"
          className="w-full px-3 py-2.5 rounded-xl border border-[#F0EDE8] bg-white text-sm text-espresso outline-none focus:border-[#E8634A] transition-colors"
        />
      </div>

      {/* Zpráva */}
      <div>
        <label className="block text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1.5">
          Zpráva
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          placeholder="Popište problém podrobněji — co se stalo, kdy, co jste dělali..."
          className="w-full px-3 py-2.5 rounded-xl border border-[#F0EDE8] bg-white text-sm text-espresso outline-none focus:border-[#E8634A] transition-colors resize-none"
        />
      </div>

      {error && <p className="text-xs text-[#DC2626] font-semibold">{error}</p>}

      <button
        onClick={send}
        disabled={status === 'sending'}
        className="w-full py-3 rounded-xl font-bold text-sm text-white border-none cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: '#E8634A' }}
      >
        {status === 'sending' ? 'Odesílám…' : 'Odeslat zprávu'}
      </button>
    </div>
  )
}
