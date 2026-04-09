'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

const TYPE_OPTIONS = [
  { value: 'account',   label: 'Problém s účtem' },
  { value: 'adoption',  label: 'Otázka k adopci' },
  { value: 'technical', label: 'Technický problém' },
  { value: 'billing',   label: 'Platby a předplatné' },
  { value: 'other',     label: 'Jiné' },
]

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', type: 'other', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('ok')
        setForm({ name: '', email: '', type: 'other', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'ok') {
    return (
      <div className="p-8 bg-white rounded-xl border border-[#F0EDE8] text-center">
        <div className="text-4xl mb-3">✉️</div>
        <h3 className="font-display font-extrabold text-xl text-[#1A0F0A] mb-2">Zpráva odeslána!</h3>
        <p className="text-sm" style={{ color: '#8B6550' }}>
          Odpovíme ti do 1–2 pracovních dnů na zadaný e-mail.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm font-bold cursor-pointer underline underline-offset-2"
          style={{ color: '#E8634A' }}
        >
          Odeslat další zprávu
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-[#1A0F0A] mb-1.5">
            Jméno <span style={{ color: '#E8634A' }}>*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Jana Nováková"
            className="w-full px-4 py-3 rounded-lg border border-[#E0DDD8] text-sm text-[#1A0F0A] placeholder:text-[#C4B8AF] outline-none focus:border-[#E8634A] transition-colors"
            style={{ background: '#FFFCF8' }}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#1A0F0A] mb-1.5">
            E-mail <span style={{ color: '#E8634A' }}>*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="jana@example.cz"
            className="w-full px-4 py-3 rounded-lg border border-[#E0DDD8] text-sm text-[#1A0F0A] placeholder:text-[#C4B8AF] outline-none focus:border-[#E8634A] transition-colors"
            style={{ background: '#FFFCF8' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-[#1A0F0A] mb-1.5">Typ dotazu</label>
        <select
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          className="w-full px-4 py-3 rounded-lg border border-[#E0DDD8] text-sm text-[#1A0F0A] outline-none focus:border-[#E8634A] transition-colors cursor-pointer"
          style={{ background: '#FFFCF8' }}
        >
          {TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-[#1A0F0A] mb-1.5">
          Zpráva <span style={{ color: '#E8634A' }}>*</span>
        </label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Popiš svůj problém nebo otázku..."
          className="w-full px-4 py-3 rounded-lg border border-[#E0DDD8] text-sm text-[#1A0F0A] placeholder:text-[#C4B8AF] outline-none focus:border-[#E8634A] transition-colors resize-none"
          style={{ background: '#FFFCF8' }}
        />
      </div>

      {status === 'error' && (
        <p className="text-sm font-medium" style={{ color: '#C0392B' }}>
          Nepodařilo se odeslat zprávu. Zkus to znovu nebo nám napiš přímo na info@zozio.cz.
        </p>
      )}

      <Button type="submit" loading={status === 'loading'} className="w-full justify-center">
        Odeslat zprávu
      </Button>
    </form>
  )
}
