'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLAN_NAMES, PLAN_EMOJI } from '@/lib/plans'
import type { SubscriptionPlan } from '@/types/database'

interface PlanSelectorProps {
  institutionId: string
  currentPlan: SubscriptionPlan
  currentExpiresAt: string | null
}

const DURATION_OPTIONS = [
  { months: 1,  label: '1 měsíc' },
  { months: 3,  label: '3 měsíce' },
  { months: 6,  label: '6 měsíců' },
  { months: 12, label: '1 rok' },
  { months: 24, label: '2 roky' },
]

const PLAN_OPTIONS: SubscriptionPlan[] = ['free', 'standard', 'pro']

const PLAN_COLOR: Record<SubscriptionPlan, string> = {
  free:     'bg-gray-pale text-gray',
  standard: 'bg-coral-light text-coral-dark',
  pro:      'bg-amber-light text-warning',
}

export function PlanSelector({ institutionId, currentPlan, currentExpiresAt }: PlanSelectorProps) {
  const router = useRouter()
  const [open,     setOpen]     = useState(false)
  const [plan,     setPlan]     = useState<SubscriptionPlan>(currentPlan)
  const [months,   setMonths]   = useState(12)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const expLabel = currentExpiresAt
    ? new Date(currentExpiresAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const save = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/institutions/${institutionId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, months }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Chyba')
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch {
      setError('Síťová chyba')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Badge — kliknutím otevře editor */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[11px] font-bold cursor-pointer border-none transition-opacity hover:opacity-75 ${PLAN_COLOR[currentPlan]}`}
      >
        {PLAN_EMOJI[currentPlan]} {PLAN_NAMES[currentPlan]}
        {expLabel && currentPlan !== 'free' && (
          <span className="opacity-60 font-normal">· {expLabel}</span>
        )}
        <span className="ml-0.5 opacity-50">▾</span>
      </button>

      {/* Dropdown editor */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-[#F0EDE8] p-4 w-64">
            <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-3">Změnit plán</div>

            {/* Výběr plánu */}
            <div className="flex gap-1.5 mb-3">
              {PLAN_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 cursor-pointer transition-all ${
                    plan === p
                      ? 'border-[#E8634A] bg-[#FAECE7] text-[#E8634A]'
                      : 'border-[#F0EDE8] bg-white text-[#8B6550] hover:border-[#E8634A]/40'
                  }`}
                >
                  {PLAN_EMOJI[p]}<br />{PLAN_NAMES[p]}
                </button>
              ))}
            </div>

            {/* Délka — pouze pro placené plány */}
            {plan !== 'free' && (
              <div className="mb-3">
                <div className="text-[10px] font-bold text-[#8B6550] uppercase tracking-wider mb-1.5">Délka předplatného</div>
                <div className="grid grid-cols-3 gap-1">
                  {DURATION_OPTIONS.map(({ months: m, label }) => (
                    <button
                      key={m}
                      onClick={() => setMonths(m)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
                        months === m
                          ? 'border-[#E8634A] bg-[#FAECE7] text-[#E8634A]'
                          : 'border-[#F0EDE8] bg-white text-[#8B6550] hover:border-[#E8634A]/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {/* Preview data vypršení */}
                <div className="mt-2 text-[10px] text-[#A09890] font-semibold">
                  Vyprší: {(() => {
                    const d = new Date()
                    d.setMonth(d.getMonth() + months)
                    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
                  })()}
                </div>
              </div>
            )}

            {plan === 'free' && (
              <p className="text-[11px] text-[#A09890] mb-3">Free plán nemá datum vypršení.</p>
            )}

            {error && <p className="text-[11px] text-[#DC2626] mb-2 font-semibold">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={loading}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-white border-none cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#E8634A' }}
              >
                {loading ? 'Ukládám…' : 'Uložit'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-bold text-[#8B6550] bg-[#F5F0EC] border-none cursor-pointer hover:bg-[#EDE8E3]"
              >
                Zrušit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
