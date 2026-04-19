'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Ad, AdSlotType, AdTier } from '@/types/database'

const SLOT_OPTIONS: { value: AdSlotType; label: string }[] = [
  { value: 'inline_grid',   label: 'Inline grid (karta v gridu zvířat)' },
  { value: 'sidebar',       label: 'Sidebar' },
  { value: 'banner_adopt',  label: 'Banner adopce (/adopt)' },
  { value: 'banner_home',   label: 'Banner homepage' },
  { value: 'banner_animal', label: 'Banner detail zvířete' },
  { value: 'newsletter',    label: 'Newsletter' },
]

const TIER_OPTIONS: { value: AdTier; label: string }[] = [
  { value: 'friend',    label: 'Friend' },
  { value: 'supporter', label: 'Supporter' },
  { value: 'partner',   label: 'Partner' },
  { value: 'main',      label: 'Hlavní partner' },
]

interface AdFormProps {
  initial?: Partial<Ad>
  mode: 'new' | 'edit'
}

export function AdForm({ initial, mode }: AdFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    company_name:   initial?.company_name   ?? '',
    contact_email:  initial?.contact_email  ?? '',
    headline:       initial?.headline       ?? '',
    description:    initial?.description    ?? '',
    cta_label:      initial?.cta_label      ?? 'Více info',
    cta_url:        initial?.cta_url        ?? '',
    logo_url:       initial?.logo_url       ?? '',
    image_url:      initial?.image_url      ?? '',
    slots:          initial?.slots          ?? [] as AdSlotType[],
    tier:           initial?.tier           ?? 'supporter' as AdTier,
    active_from:    initial?.active_from    ?? '',
    active_to:      initial?.active_to      ?? '',
    active:         initial?.active         ?? true,
    notes:          initial?.notes          ?? '',
  })

  const toggle = (slot: AdSlotType) => {
    setForm(f => ({
      ...f,
      slots: f.slots.includes(slot)
        ? f.slots.filter(s => s !== slot)
        : [...f.slots, slot],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      contact_email:  form.contact_email  || null,
      description:    form.description    || null,
      logo_url:       form.logo_url       || null,
      image_url:      form.image_url      || null,
      notes:          form.notes          || null,
    }

    const url  = mode === 'new' ? '/api/superadmin/ads' : `/api/ads/${initial?.id}`
    const method = mode === 'new' ? 'POST' : 'PUT'

    const res = await fetch(url, {
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

    router.push('/superadmin/ads')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!initial?.id) return
    if (!confirm('Opravdu chcete smazat tuto reklamu? Akce je nevratná.')) return
    setDeleting(true)
    await fetch(`/api/ads/${initial.id}`, { method: 'DELETE' })
    router.push('/superadmin/ads')
    router.refresh()
  }

  const handleToggleActive = async () => {
    if (!initial?.id) return
    await fetch(`/api/ads/${initial.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !initial.active }),
    })
    router.refresh()
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2'
  const inputStyle = { borderColor: '#E0DDD8', color: '#2C1810' }
  const labelCls = 'block text-xs font-bold mb-1.5 uppercase tracking-wider'
  const labelStyle = { color: '#8B6550' }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg text-sm font-semibold" style={{ background: '#FAECE7', color: '#E8634A' }}>
          {error}
        </div>
      )}

      {/* Inzerent */}
      <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#2C1810' }}>Inzerent</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>Firma *</label>
            <input className={inputCls} style={inputStyle} required value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Kontaktní email</label>
            <input type="email" className={inputCls} style={inputStyle} value={form.contact_email}
              onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Kreativa */}
      <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#2C1810' }}>Kreativa</h2>
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
                <img src={form.logo_url} alt="Logo preview" className="mt-2 h-10 object-contain rounded" />
              )}
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Image URL (banner)</label>
              <input type="url" className={inputCls} style={inputStyle} value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              {form.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="Image preview" className="mt-2 h-16 object-cover rounded-lg w-full" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sloty */}
      <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#2C1810' }}>Reklamní sloty</h2>
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

      {/* Trvání & Tier */}
      <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#2C1810' }}>Nastavení</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>Tier</label>
            <select className={inputCls} style={inputStyle} value={form.tier}
              onChange={e => setForm(f => ({ ...f, tier: e.target.value as AdTier }))}>
              {TIER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
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

        <div className="mt-4 flex items-center gap-3">
          <button type="button"
            onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            style={{ background: form.active ? '#E8634A' : '#D1C9C4' }}
            role="switch" aria-checked={form.active}>
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"
              style={{ transform: form.active ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
          <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>
            {form.active ? 'Aktivní' : 'Neaktivní'}
          </span>
        </div>
      </div>

      {/* Interní poznámka */}
      <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#2C1810' }}>Interní poznámka</h2>
        <textarea className={inputCls} style={inputStyle} rows={3} value={form.notes}
          placeholder="Poznámka pro Dana (interní, nezobrazuje se veřejně)"
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      {/* Statistiky v edit módu */}
      {mode === 'edit' && initial && (
        <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base mb-5" style={{ color: '#2C1810' }}>Statistiky</h2>
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: '#E8634A' }}>
            {saving ? 'Ukládám...' : mode === 'new' ? 'Vytvořit reklamu' : 'Uložit změny'}
          </button>
          <a href="/superadmin/ads"
            className="px-4 py-2.5 rounded-lg text-sm font-semibold no-underline transition-all hover:opacity-80"
            style={{ color: '#8B6550', background: '#F0EDE8' }}>
            Zrušit
          </a>
        </div>

        {mode === 'edit' && initial?.id && (
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleToggleActive}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: '#E0DDD8', color: '#2C1810', background: 'white' }}>
              {initial.active ? 'Deaktivovat' : 'Aktivovat'}
            </button>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: '#FEE2E2', color: '#DC2626' }}>
              {deleting ? 'Mažu...' : 'Smazat'}
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
