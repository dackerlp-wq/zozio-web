'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Ad, AdSlotType, AdStatus } from '@/types/database'

const SLOT_OPTIONS: { value: AdSlotType; label: string }[] = [
  { value: 'inline_grid',   label: 'Inline grid (karta v gridu zvířat)' },
  { value: 'sidebar',       label: 'Sidebar' },
  { value: 'banner_adopt',  label: 'Banner adopce (/adopt)' },
  { value: 'banner_home',   label: 'Banner homepage' },
  { value: 'banner_animal', label: 'Banner detail zvířete' },
  { value: 'newsletter',    label: 'Newsletter' },
]

const STATUS_LABEL: Record<AdStatus, string> = {
  draft:          'Koncept',
  pending_review: 'Čeká na schválení',
  approved:       'Schválena',
  rejected:       'Zamítnuta',
  paused:         'Pozastavena',
}

const STATUS_STYLE: Record<AdStatus, { bg: string; color: string }> = {
  draft:          { bg: '#F0EDE8', color: '#6B4030' },
  pending_review: { bg: '#FEF9E7', color: '#854F0B' },
  approved:       { bg: '#EAF3DE', color: '#3B6D11' },
  rejected:       { bg: '#FAECE7', color: '#993C1D' },
  paused:         { bg: '#F0EDE8', color: '#8B6550' },
}

interface PortalAdFormProps {
  initial?: Partial<Ad>
  mode: 'new' | 'edit'
}

export function PortalAdForm({ initial, mode }: PortalAdFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    headline:       initial?.headline       ?? '',
    description:    initial?.description    ?? '',
    cta_label:      initial?.cta_label      ?? 'Více info',
    cta_url:        initial?.cta_url        ?? '',
    logo_url:       initial?.logo_url       ?? '',
    image_url:      initial?.image_url      ?? '',
    slots:          initial?.slots          ?? [] as AdSlotType[],
    active_from:    initial?.active_from    ?? '',
    active_to:      initial?.active_to      ?? '',
  })

  const toggle = (slot: AdSlotType) => {
    setForm(f => ({
      ...f,
      slots: f.slots.includes(slot)
        ? f.slots.filter(s => s !== slot)
        : [...f.slots, slot],
    }))
  }

  const getPayload = () => ({
    ...form,
    description: form.description || null,
    logo_url:    form.logo_url    || null,
    image_url:   form.image_url   || null,
  })

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSaving(true)
    setError(null)

    const url    = mode === 'new' ? '/api/portal/ads' : `/api/portal/ads/${initial?.id}`
    const method = mode === 'new' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getPayload()),
    })

    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error ?? 'Chyba při ukládání')
      setSaving(false)
      return
    }

    if (mode === 'new') {
      const data = await res.json()
      router.push(`/portal/ads/${data.id}`)
    } else {
      router.refresh()
    }
    setSaving(false)
  }

  const handleSubmitForReview = async () => {
    // Pro nové reklamy nejprve uložit, pak odeslat
    if (mode === 'new') {
      setSubmitting(true)
      setError(null)
      const res = await fetch('/api/portal/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload()),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? 'Chyba při ukládání')
        setSubmitting(false)
        return
      }
      const data = await res.json()
      // Odeslat ke schválení
      await fetch(`/api/portal/ads/${data.id}/submit`, { method: 'POST' })
      router.push('/portal/ads')
      setSubmitting(false)
      return
    }

    // Pro edit
    setSubmitting(true)
    setError(null)
    // Nejprve uložit změny
    const saveRes = await fetch(`/api/portal/ads/${initial?.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getPayload()),
    })
    if (!saveRes.ok) {
      const j = await saveRes.json().catch(() => ({}))
      setError(j.error ?? 'Chyba při ukládání')
      setSubmitting(false)
      return
    }
    // Odeslat ke schválení
    await fetch(`/api/portal/ads/${initial?.id}/submit`, { method: 'POST' })
    router.push('/portal/ads')
    setSubmitting(false)
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2'
  const inputStyle = { borderColor: '#E0DDD8', color: '#2C1810' }
  const labelCls = 'block text-xs font-bold mb-1.5 uppercase tracking-wider'
  const labelStyle = { color: '#8B6550' }
  const status = initial?.status ?? 'draft'

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg text-sm font-semibold" style={{ background: '#FAECE7', color: '#993C1D' }}>
          {error}
        </div>
      )}

      {/* Rejection reason banner */}
      {status === 'rejected' && initial?.rejection_reason && (
        <div className="p-4 rounded-xl border" style={{ background: '#FAECE7', borderColor: '#FECACA', color: '#993C1D' }}>
          <p className="font-bold text-sm mb-1">Reklama byla zamítnuta</p>
          <p className="text-sm">{initial.rejection_reason}</p>
        </div>
      )}

      {/* Status (readonly) */}
      {mode === 'edit' && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Stav:</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: STATUS_STYLE[status].bg, color: STATUS_STYLE[status].color }}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      )}

      {/* Kreativa */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#1A0F0A' }}>Kreativa</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls} style={labelStyle}>
              Headline * <span className="font-normal normal-case tracking-normal">({form.headline.length}/60)</span>
            </label>
            <input className={inputCls} style={inputStyle} required maxLength={60} value={form.headline}
              onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>
              Popis <span className="font-normal normal-case tracking-normal">({form.description.length}/120)</span>
            </label>
            <textarea className={inputCls} style={inputStyle} maxLength={120} rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>CTA Label *</label>
              <input className={inputCls} style={inputStyle} required value={form.cta_label}
                onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>CTA URL *</label>
              <input type="url" className={inputCls} style={inputStyle} required value={form.cta_url}
                onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>Logo URL</label>
              <input type="url" className={inputCls} style={inputStyle} value={form.logo_url}
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
              {form.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logo_url} alt="Logo" className="mt-2 h-10 object-contain rounded" />
              )}
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Image URL (banner)</label>
              <input type="url" className={inputCls} style={inputStyle} value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              {form.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="Banner" className="mt-2 h-16 object-cover rounded-lg w-full" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sloty */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#1A0F0A' }}>Reklamní sloty</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SLOT_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all"
              style={form.slots.includes(opt.value)
                ? { borderColor: '#E8634A', background: '#FAECE7' }
                : { borderColor: '#E0DDD8', background: 'white' }}>
              <input type="checkbox" className="w-4 h-4 accent-[#E8634A]"
                checked={form.slots.includes(opt.value)}
                onChange={() => toggle(opt.value)} />
              <span className="text-sm font-medium" style={{ color: '#2C1810' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Období */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#1A0F0A' }}>Období kampaně</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>Aktivní od *</label>
            <input type="date" className={inputCls} style={inputStyle} required value={form.active_from}
              onChange={e => setForm(f => ({ ...f, active_from: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Aktivní do *</label>
            <input type="date" className={inputCls} style={inputStyle} required value={form.active_to}
              onChange={e => setForm(f => ({ ...f, active_to: e.target.value }))} />
          </div>
        </div>
        <p className="mt-3 text-xs" style={{ color: '#8B6550' }}>
          Tier a aktivaci nastavuje Zozio tým po schválení reklamy.
        </p>
      </div>

      {/* Statistiky v edit módu */}
      {mode === 'edit' && initial && (
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base mb-5" style={{ color: '#1A0F0A' }}>Statistiky</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="font-display font-extrabold text-3xl" style={{ color: '#E8634A' }}>
                {(initial.impressions ?? 0).toLocaleString('cs-CZ')}
              </div>
              <div className="text-xs font-semibold mt-1" style={{ color: '#8B6550' }}>Zobrazení</div>
            </div>
            <div className="text-center">
              <div className="font-display font-extrabold text-3xl" style={{ color: '#E8634A' }}>
                {(initial.clicks ?? 0).toLocaleString('cs-CZ')}
              </div>
              <div className="text-xs font-semibold mt-1" style={{ color: '#8B6550' }}>Kliky</div>
            </div>
            <div className="text-center">
              <div className="font-display font-extrabold text-3xl" style={{ color: '#E8634A' }}>
                {(initial.impressions ?? 0) > 0
                  ? (((initial.clicks ?? 0) / (initial.impressions ?? 1)) * 100).toFixed(2)
                  : '0.00'}%
              </div>
              <div className="text-xs font-semibold mt-1" style={{ color: '#8B6550' }}>CTR</div>
            </div>
          </div>
        </div>
      )}

      {/* Akce */}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={saving || submitting}
          className="px-5 py-2.5 rounded-lg text-sm font-bold border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: '#F0EDE8', color: '#6B4030' }}>
          {saving ? 'Ukládám...' : 'Uložit jako koncept'}
        </button>

        {(mode === 'new' || status === 'draft' || status === 'rejected') && (
          <button type="button" onClick={handleSubmitForReview} disabled={saving || submitting}
            className="px-5 py-2.5 rounded-lg text-sm font-bold border-none cursor-pointer text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: '#E8634A' }}>
            {submitting ? 'Odesílám...' : 'Odeslat ke schválení →'}
          </button>
        )}

        <a href="/portal/ads"
          className="px-4 py-2.5 rounded-lg text-sm font-semibold no-underline transition-all hover:opacity-80"
          style={{ color: '#8B6550' }}>
          Zrušit
        </a>
      </div>
    </form>
  )
}
