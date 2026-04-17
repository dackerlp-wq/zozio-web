'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  animalId: string
  /** Kladné = zbývá N dní; 0 nebo záporné = skončila */
  daysRemaining: number
  /** Navrhované nové datum pro prodloužení (ISO YYYY-MM-DD) */
  defaultExtendDate: string
}

export function QuarantineChip({ animalId, daysRemaining, defaultExtendDate }: Props) {
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

  /* Aktivní karanténa — jednoduchý čip */
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

  /* Prodloužení karantény — inline date picker */
  if (mode === 'extend') {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <input
          type="date"
          value={extendDate}
          onChange={e => setExtendDate(e.target.value)}
          className="text-[11px] border rounded px-1.5 py-0.5"
          style={{ borderColor: '#F0EDE8', color: '#2C1810' }}
        />
        <button
          onClick={() => { setMode('idle'); updateAnimal({ quarantine_end: extendDate }) }}
          disabled={isPending || !extendDate}
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: '#E8634A', opacity: isPending ? 0.6 : 1 }}
        >
          Uložit
        </button>
        <button
          onClick={() => setMode('idle')}
          className="text-[10px] text-[#8B6550] px-1"
        >
          ✕
        </button>
      </div>
    )
  }

  /* Karanténa skončila — akční tlačítka */
  return (
    <div className="flex flex-wrap gap-1">
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: '#FEE2E2', color: '#991B1B' }}
      >
        ⚠️ Konec karantény
      </span>
      <button
        onClick={() => updateAnimal({ adoption_status: 'available' })}
        disabled={isPending}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer border-0"
        style={{ background: '#D1FAE5', color: '#065F46', opacity: isPending ? 0.6 : 1 }}
      >
        K adopci
      </button>
      <button
        onClick={() => updateAnimal({ adoption_status: 'foster' })}
        disabled={isPending}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer border-0"
        style={{ background: '#DBEAFE', color: '#1E40AF', opacity: isPending ? 0.6 : 1 }}
      >
        Dočasná péče
      </button>
      <button
        onClick={() => setMode('extend')}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer border-0"
        style={{ background: '#FEF3C7', color: '#92400E' }}
      >
        Prodloužit
      </button>
    </div>
  )
}
