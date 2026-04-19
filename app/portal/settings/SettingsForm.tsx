'use client'

import { useState } from 'react'
import type { AdCompany } from '@/types/database'

interface SettingsFormProps {
  initial: AdCompany | null
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    company_name:    initial?.company_name    ?? '',
    contact_name:    initial?.contact_name    ?? '',
    contact_email:   initial?.contact_email   ?? '',
    phone:           initial?.phone           ?? '',
    website:         initial?.website         ?? '',
    ico:             initial?.ico             ?? '',
    billing_name:    initial?.billing_name    ?? '',
    billing_address: initial?.billing_address ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const method = initial ? 'PUT' : 'POST'
    const payload = {
      company_name:    form.company_name,
      contact_name:    form.contact_name    || null,
      contact_email:   form.contact_email,
      phone:           form.phone           || null,
      website:         form.website         || null,
      ico:             form.ico             || null,
      billing_name:    form.billing_name    || null,
      billing_address: form.billing_address || null,
    }

    const res = await fetch('/api/portal/company', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error ?? 'Chyba při ukládání')
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2'
  const inputStyle = { borderColor: '#E0DDD8', color: '#2C1810' }
  const labelCls = 'block text-xs font-bold mb-1.5 uppercase tracking-wider'
  const labelStyle = { color: '#8B6550' }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 rounded-lg text-sm font-semibold" style={{ background: '#FAECE7', color: '#993C1D' }}>
          {error}
        </div>
      )}
      {saved && (
        <div className="p-4 rounded-lg text-sm font-semibold" style={{ background: '#EAF3DE', color: '#3B6D11' }}>
          Uloženo ✓
        </div>
      )}

      {/* Základní info */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#1A0F0A' }}>Základní informace</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls} style={labelStyle}>Název firmy *</label>
            <input className={inputCls} style={inputStyle} required value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>Kontaktní osoba</label>
              <input className={inputCls} style={inputStyle} value={form.contact_name}
                onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Kontaktní email *</label>
              <input type="email" className={inputCls} style={inputStyle} required value={form.contact_email}
                onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>Telefon</label>
              <input type="tel" className={inputCls} style={inputStyle} value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Web</label>
              <input type="url" className={inputCls} style={inputStyle} value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Fakturační údaje */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#1A0F0A' }}>Fakturační údaje</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls} style={labelStyle}>IČO</label>
            <input className={inputCls} style={inputStyle} value={form.ico}
              placeholder="12345678"
              onChange={e => setForm(f => ({ ...f, ico: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Fakturační název</label>
            <input className={inputCls} style={inputStyle} value={form.billing_name}
              onChange={e => setForm(f => ({ ...f, billing_name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Fakturační adresa</label>
            <textarea className={inputCls} style={inputStyle} rows={2} value={form.billing_address}
              placeholder="Ulice čp, Město, PSČ"
              onChange={e => setForm(f => ({ ...f, billing_address: e.target.value }))} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="px-6 py-2.5 rounded-lg text-sm font-bold text-white border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: '#E8634A' }}>
        {saving ? 'Ukládám...' : 'Uložit'}
      </button>
    </form>
  )
}
