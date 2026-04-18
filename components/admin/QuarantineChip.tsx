'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Původy, u nichž platí zákonná ochranná lhůta pro majitele (§25 zák. 246/1992 Sb.)
 * Lhůta: 2 měsíce od příjmu — než lze zvíře nabídnout k adopci.
 */
const PROTECTIVE_ORIGINS = new Set(['found', 'municipal_capture'])
const PROTECTIVE_DAYS = 60 // 2 měsíce

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate)
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

interface Props {
  animalId: string
  /** Kladné = zbývá N dní karantény; 0/záporné = skončila */
  daysRemaining: number
  /** Navrhované nové datum pro prodloužení karantény */
  defaultExtendDate: string
  /** Způsob příjmu — rozhoduje o ochranné lhůtě */
  origin?: string | null
  /** Datum příjmu — základ pro výpočet ochranné lhůty */
  intakeDate?: string | null
}

export function QuarantineChip({ animalId, daysRemaining, defaultExtendDate, origin, intakeDate }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'idle' | 'extend'>('idle')
  const [extendDate, setExtendDate] = useState(defaultExtendDate)

  async function updateAnimal(body: Record<string, unknown>) {
    const res = await fetch(`/api/animals/${animalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) startTransition(() => router.refresh())
  }

  /* ── Aktivní karanténa ─────────────────────────────────── */
  if (daysRemaining > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: '#FEF3C7', color: '#92400E' }}
        title={`Karanténa: zbývá ${daysRemaining} dní`}
      >
        🚧 {daysRemaining} d.
      </span>
    )
  }

  /* ── Karanténa skončila — spočítej ochrannou lhůtu ─────── */
  const hasProtective = origin && intakeDate && PROTECTIVE_ORIGINS.has(origin)
  const protectiveEnd = hasProtective ? addDays(intakeDate!, PROTECTIVE_DAYS) : null
  const protectiveDaysLeft = protectiveEnd ? daysUntil(protectiveEnd) : 0

  /* ── Ochranná lhůta stále běží ─────────────────────────── */
  if (protectiveDaysLeft > 0) {
    return (
      <div className="flex flex-wrap gap-1">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ background: '#EEF2FF', color: '#3730A3' }}
          title="Zákonná ochranná lhůta pro vyzvednutí majitelem (§25 zák. 246/1992 Sb.)"
        >
          ⚖️ {protectiveDaysLeft} d. ochr. lhůta
        </span>
        {/* Prodloužení karantény stále možné */}
        {mode === 'extend' ? (
          <div className="flex items-center gap-1">
            <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)}
              className="text-[11px] border rounded px-1.5 py-0.5" style={{ borderColor: '#F0EDE8', color: '#2C1810' }} />
            <button onClick={() => { setMode('idle'); updateAnimal({ quarantine_end: extendDate }) }}
              disabled={isPending || !extendDate}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white border-0"
              style={{ background: '#E8634A', opacity: isPending ? 0.6 : 1, cursor: 'pointer' }}>
              Uložit
            </button>
            <button onClick={() => setMode('idle')} className="text-[10px] text-[#8B6550] px-1 border-0 bg-transparent cursor-pointer">✕</button>
          </div>
        ) : (
          <button onClick={() => setMode('extend')}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border-0 cursor-pointer"
            style={{ background: '#FEF3C7', color: '#92400E' }}>
            Prodloužit karanténu
          </button>
        )}
      </div>
    )
  }

  /* ── Prodloužení karantény ──────────────────────────────── */
  if (mode === 'extend') {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)}
          className="text-[11px] border rounded px-1.5 py-0.5" style={{ borderColor: '#F0EDE8', color: '#2C1810' }} />
        <button onClick={() => { setMode('idle'); updateAnimal({ quarantine_end: extendDate }) }}
          disabled={isPending || !extendDate}
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white border-0 cursor-pointer"
          style={{ background: '#E8634A', opacity: isPending ? 0.6 : 1 }}>
          Uložit
        </button>
        <button onClick={() => setMode('idle')} className="text-[10px] text-[#8B6550] px-1 border-0 bg-transparent cursor-pointer">✕</button>
      </div>
    )
  }

  /* ── Obě lhůty uplynuly — akční tlačítka ───────────────── */
  return (
    <div className="flex flex-wrap gap-1">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: '#FEE2E2', color: '#991B1B' }}>
        ⚠️ Konec karantény
      </span>
      <button onClick={() => updateAnimal({ adoption_status: 'available', in_quarantine: false })} disabled={isPending}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer border-0"
        style={{ background: '#D1FAE5', color: '#065F46', opacity: isPending ? 0.6 : 1 }}>
        K adopci
      </button>
      <button onClick={() => updateAnimal({ adoption_status: 'foster', in_quarantine: false })} disabled={isPending}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer border-0"
        style={{ background: '#DBEAFE', color: '#1E40AF', opacity: isPending ? 0.6 : 1 }}>
        Dočasná péče
      </button>
      <button onClick={() => setMode('extend')}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer border-0"
        style={{ background: '#FEF3C7', color: '#92400E' }}>
        Prodloužit
      </button>
    </div>
  )
}
