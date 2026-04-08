'use client'
import { useState } from 'react'

interface DonationWidgetProps {
  fundraiser: {
    id:             string
    title:          string
    description?:   string | null
    goal_amount:    number
    current_amount: number
    active:         boolean
    deadline?:      string | null
  }
  variant?: 'shelter' | 'rescue'
}

const PRESET_AMOUNTS = [100, 250, 500, 1000]

export function DonationWidget({ fundraiser: f, variant = 'rescue' }: DonationWidgetProps) {
  const [selected,  setSelected]  = useState<number | null>(250)
  const [custom,    setCustom]    = useState('')
  const [submitted, setSubmitted] = useState(false)

  const accent = variant === 'rescue' ? '#2E9E8F' : '#E8634A'
  const accentBg = variant === 'rescue' ? '#E1F5EE' : '#FAECE7'
  const accentText = variant === 'rescue' ? '#0F6E56' : '#993C1D'

  const pct      = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
  const amount   = custom ? parseInt(custom) : (selected ?? 0)

  const daysLeft = f.deadline
    ? Math.max(0, Math.ceil((new Date(f.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const handleDonate = () => {
    if (amount < 10) return
    // Placeholder — Stripe bude integrován
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  if (!f.active) {
    return (
      <div className="bg-white rounded-lg border border-[#F0EDE8] p-5">
        <div className="text-center py-2">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-bold text-[#1A0F0A] mb-1">Sbírka ukončena</p>
          <p className="text-sm" style={{ color: '#8B6550' }}>
            Vybralo se {f.current_amount.toLocaleString('cs-CZ')} Kč z {f.goal_amount.toLocaleString('cs-CZ')} Kč
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-[#F0EDE8] overflow-hidden">

      {/* Header */}
      <div className="p-5 border-b border-[#F0EDE8]">
        <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6550' }}>
          Aktivní sbírka
        </div>
        <div className="font-bold text-[#1A0F0A] leading-tight mb-3">{f.title}</div>

        {/* Progress */}
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-bold text-[#1A0F0A]">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
          <span style={{ color: '#8B6550' }}>z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: '#F0EDE8' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: accent }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: accent }}>{pct}% vybráno</span>
          {daysLeft !== null && (
            <span className="text-xs font-medium" style={{ color: '#8B6550' }}>
              {daysLeft > 0 ? `${daysLeft} dní zbývá` : 'Poslední den!'}
            </span>
          )}
        </div>
      </div>

      {/* Výběr částky */}
      <div className="p-5">
        {submitted ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-bold text-[#1A0F0A] mb-1">Děkujeme za příspěvek!</p>
            <p className="text-sm" style={{ color: '#8B6550' }}>
              Vaše podpora pomáhá zachraňovat zvířata.
            </p>
          </div>
        ) : (
          <>
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#8B6550' }}>
              Vyberte částku
            </div>

            {/* Přednastavené částky */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => { setSelected(amt); setCustom('') }}
                  className="py-2.5 rounded-lg text-sm font-bold cursor-pointer border-2 transition-all"
                  style={selected === amt && !custom
                    ? { background: accentBg, borderColor: accent, color: accentText }
                    : { background: 'white', borderColor: '#F0EDE8', color: '#6B4030' }
                  }
                >
                  {amt}
                </button>
              ))}
            </div>

            {/* Vlastní částka */}
            <div className="relative mb-4">
              <input
                type="number"
                value={custom}
                onChange={e => { setCustom(e.target.value); setSelected(null) }}
                placeholder="Jiná částka..."
                min="10"
                className="w-full px-4 py-2.5 rounded-lg border-2 text-sm outline-none transition-all pr-10"
                style={{
                  borderColor: custom ? accent : '#F0EDE8',
                  background: custom ? accentBg : 'white',
                  color: '#1A0F0A',
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: '#8B6550' }}>Kč</span>
            </div>

            {/* Donate button */}
            <button
              onClick={handleDonate}
              disabled={amount < 10}
              className="w-full py-3.5 rounded-lg font-bold text-base text-white cursor-pointer border-none transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: amount >= 10 ? accent : '#C8C5BF' }}
            >
              {amount >= 10
                ? `Přispět ${amount.toLocaleString('cs-CZ')} Kč`
                : 'Zadejte částku'}
            </button>

            <p className="text-center text-xs mt-3" style={{ color: '#8B6550' }}>
              Platba kartou přes Stripe · Bezpečné
            </p>
          </>
        )}
      </div>
    </div>
  )
}
