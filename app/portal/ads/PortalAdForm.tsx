'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Ad, AdSlotType, AdStatus } from '@/types/database'

const SLOT_OPTIONS: { value: AdSlotType; label: string; desc: string }[] = [
  { value: 'inline_grid',   label: 'Inline grid',      desc: 'Karta v gridu zvířat' },
  { value: 'sidebar',       label: 'Sidebar',          desc: 'Postranní panel' },
  { value: 'banner_adopt',  label: 'Banner adopce',    desc: 'Stránka /adopt' },
  { value: 'banner_home',   label: 'Banner homepage',  desc: 'Domovská stránka' },
  { value: 'banner_animal', label: 'Banner zvíře',     desc: 'Detail každého zvířete' },
  { value: 'newsletter',    label: 'Newsletter',        desc: 'E-mailový bulletin' },
]

// Ceny bez DPH v Kč / měsíc (newsletter = cena za jedno vydání)
const SLOT_PRICES: Record<AdSlotType, number> = {
  inline_grid:   1490,
  sidebar:       1990,
  banner_adopt:  2990,
  banner_home:   3490,
  banner_animal: 1990,
  newsletter:    1490,
}

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

  // ── Cenová kalkulace ───────────────────────────────────────────────────────
  const pricing = useMemo(() => {
    const durationDays = form.active_from && form.active_to
      ? Math.max(0, Math.round(
          (new Date(form.active_to).getTime() - new Date(form.active_from).getTime())
          / (1000 * 60 * 60 * 24)
        ))
      : 0

    const lines = form.slots.map(slot => {
      const monthlyPrice = SLOT_PRICES[slot] ?? 0
      const isNewsletter = slot === 'newsletter'
      const price = isNewsletter
        ? monthlyPrice
        : Math.round((monthlyPrice / 30) * durationDays)
      return {
        slot,
        label: SLOT_OPTIONS.find(o => o.value === slot)?.label ?? slot,
        price,
        isNewsletter,
      }
    })

    const subtotal = lines.reduce((s, l) => s + l.price, 0)
    const discountPct = durationDays >= 90 ? 20 : durationDays >= 60 ? 10 : 0
    const discountAmount = Math.round(subtotal * discountPct / 100)
    const afterDiscount = subtotal - discountAmount
    const vat = Math.round(afterDiscount * 0.21)
    const total = afterDiscount + vat

    return { durationDays, lines, subtotal, discountPct, discountAmount, afterDiscount, vat, total }
  }, [form.slots, form.active_from, form.active_to])

  const showPricing = pricing.lines.length > 0 && pricing.durationDays > 0

  // ── Payload & akce ────────────────────────────────────────────────────────
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
      await fetch(`/api/portal/ads/${data.id}/submit`, { method: 'POST' })
      router.push('/portal/ads')
      setSubmitting(false)
      return
    }

    setSubmitting(true)
    setError(null)
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

      {status === 'rejected' && initial?.rejection_reason && (
        <div className="p-4 rounded-xl border" style={{ background: '#FAECE7', borderColor: '#FECACA', color: '#993C1D' }}>
          <p className="font-bold text-sm mb-1">Reklama byla zamítnuta</p>
          <p className="text-sm">{initial.rejection_reason}</p>
        </div>
      )}

      {mode === 'edit' && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Stav:</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: STATUS_STYLE[status].bg, color: STATUS_STYLE[status].color }}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      )}

      {/* ── Kreativa ── */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#1A0F0A' }}>Kreativa</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls} style={labelStyle}>
              Headline * <span className="font-normal normal-case tracking-normal text-[#A89080]">({form.headline.length}/60)</span>
            </label>
            <input className={inputCls} style={inputStyle} required maxLength={60} value={form.headline}
              onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>
              Popis <span className="font-normal normal-case tracking-normal text-[#A89080]">({form.description.length}/120)</span>
            </label>
            <textarea className={inputCls} style={inputStyle} maxLength={120} rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>CTA tlačítko *</label>
              <input className={inputCls} style={inputStyle} required value={form.cta_label}
                onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Cílová URL *</label>
              <input type="url" className={inputCls} style={inputStyle} required value={form.cta_url}
                placeholder="https://vasefirma.cz"
                onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>Logo URL</label>
              <input type="url" className={inputCls} style={inputStyle} value={form.logo_url}
                placeholder="https://..."
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
              {form.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logo_url} alt="Logo" className="mt-2 h-10 object-contain rounded" />
              )}
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Obrázek / banner URL</label>
              <input type="url" className={inputCls} style={inputStyle} value={form.image_url}
                placeholder="https://..."
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              {form.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="Banner" className="mt-2 h-16 object-cover rounded-lg w-full" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Reklamní sloty ── */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#F0EDE8' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>Reklamní plochy</h2>
            <p className="text-xs mt-1" style={{ color: '#8B6550' }}>Vyberte kde se reklama zobrazí</p>
          </div>
          {form.slots.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#FAECE7', color: '#E8634A' }}>
              {form.slots.length} vybráno
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SLOT_OPTIONS.map(opt => {
            const selected = form.slots.includes(opt.value)
            const price = SLOT_PRICES[opt.value]
            return (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all"
                style={selected
                  ? { borderColor: '#E8634A', background: '#FAECE7' }
                  : { borderColor: '#E0DDD8', background: 'white' }}>
                <input type="checkbox" className="mt-0.5 w-4 h-4 flex-shrink-0 accent-[#E8634A]"
                  checked={selected}
                  onChange={() => toggle(opt.value)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>{opt.label}</span>
                    <span className="text-xs font-bold whitespace-nowrap" style={{ color: selected ? '#E8634A' : '#8B6550' }}>
                      {price.toLocaleString('cs-CZ')} Kč
                      <span className="font-normal">/{opt.value === 'newsletter' ? 'vydání' : 'měs.'}</span>
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#8B6550' }}>{opt.desc}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* ── Období ── */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-5" style={{ color: '#1A0F0A' }}>Období kampaně</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>Aktivní od *</label>
            <input type="date" className={inputCls} style={inputStyle} required value={form.active_from}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(f => ({ ...f, active_from: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Aktivní do *</label>
            <input type="date" className={inputCls} style={inputStyle} required value={form.active_to}
              min={form.active_from || new Date().toISOString().split('T')[0]}
              onChange={e => setForm(f => ({ ...f, active_to: e.target.value }))} />
          </div>
        </div>
        {pricing.durationDays > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#F0EDE8', color: '#6B4030' }}>
              {pricing.durationDays} dní
            </span>
            {pricing.discountPct > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                🎉 Sleva {pricing.discountPct}% za dlouhodobou kampaň
              </span>
            )}
            {pricing.durationDays >= 30 && pricing.durationDays < 60 && (
              <span className="text-xs" style={{ color: '#854F0B' }}>
                💡 60+ dní = −10%, 90+ dní = −20%
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Cenová kalkulace ── */}
      {showPricing && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E8634A' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#FAECE7' }}>
            <span className="text-base">🧮</span>
            <h2 className="font-display font-bold text-sm" style={{ color: '#E8634A' }}>Orientační cena</h2>
            <span className="text-xs ml-auto" style={{ color: '#8B6550' }}>Bez závazku — potvrdí tým Zozio</span>
          </div>
          <div className="px-5 py-4 bg-white">
            {/* Rozpad per slot */}
            <div className="space-y-2 mb-4">
              {pricing.lines.map(line => (
                <div key={line.slot} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium" style={{ color: '#2C1810' }}>{line.label}</span>
                    <span className="text-xs ml-2" style={{ color: '#A89080' }}>
                      {line.isNewsletter ? '1 vydání' : `${pricing.durationDays} dní`}
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums" style={{ color: '#1A0F0A' }}>
                    {line.price.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
              ))}
            </div>

            {/* Součty */}
            <div className="border-t pt-3 space-y-1.5" style={{ borderColor: '#F0EDE8' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8B6550' }}>Mezisoučet bez DPH</span>
                <span className="tabular-nums" style={{ color: '#1A0F0A' }}>
                  {pricing.subtotal.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
              {pricing.discountPct > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#3B6D11' }}>Sleva {pricing.discountPct}% (kampaň {pricing.durationDays}+ dní)</span>
                  <span className="tabular-nums font-semibold" style={{ color: '#3B6D11' }}>
                    −{pricing.discountAmount.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8B6550' }}>DPH 21 %</span>
                <span className="tabular-nums" style={{ color: '#1A0F0A' }}>
                  {pricing.vat.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t mt-2" style={{ borderColor: '#F0EDE8' }}>
                <span className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>Celkem s DPH</span>
                <span className="font-display font-extrabold text-xl tabular-nums" style={{ color: '#E8634A' }}>
                  {pricing.total.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
            </div>

            {/* Ceník reference */}
            <div className="mt-4 pt-3 border-t" style={{ borderColor: '#F0EDE8' }}>
              <p className="text-xs" style={{ color: '#A89080' }}>
                Ceny jsou orientační bez závazku. Finální cena bude upřesněna po schválení reklamy týmem Zozio.
                Platba probíhá na základě faktury před spuštěním kampaně.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Akce ── */}
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
