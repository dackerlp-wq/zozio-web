'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

interface DaySchedule {
  open: boolean
  from: string
  to: string
}

interface SeasonSchedule {
  label: string
  months: number[]
  days: Record<DayKey, DaySchedule>
}

interface OpeningHoursData {
  year_round: boolean
  seasons: SeasonSchedule[]
  public_holidays: 'closed' | 'normal' | 'custom'
  public_holidays_custom?: { from: string; to: string }
  access_type: 'full_grounds' | 'office_only' | 'appointment_only'
  access_note: string
  note: string
}

const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Pondělí',
  tue: 'Úterý',
  wed: 'Středa',
  thu: 'Čtvrtek',
  fri: 'Pátek',
  sat: 'Sobota',
  sun: 'Neděle',
}

const WEEKDAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri']
const WEEKEND: DayKey[] = ['sat', 'sun']

const DEFAULT_DAY_SCHEDULE: DaySchedule = { open: false, from: '', to: '' }

const DEFAULT_HOURS: OpeningHoursData = {
  year_round: true,
  seasons: [{
    label: 'Celoroční',
    months: [],
    days: {
      mon: { open: true, from: '08:00', to: '17:00' },
      tue: { open: true, from: '08:00', to: '17:00' },
      wed: { open: true, from: '08:00', to: '17:00' },
      thu: { open: true, from: '08:00', to: '17:00' },
      fri: { open: true, from: '08:00', to: '17:00' },
      sat: { open: true, from: '09:00', to: '12:00' },
      sun: { open: false, from: '', to: '' },
    },
  }],
  public_holidays: 'closed',
  access_type: 'full_grounds',
  access_note: '',
  note: '',
}

const SEASONAL_DEFAULT: OpeningHoursData = {
  year_round: false,
  seasons: [
    {
      label: 'Léto (dub–září)',
      months: [4, 5, 6, 7, 8, 9],
      days: {
        mon: { open: true, from: '08:00', to: '18:00' },
        tue: { open: true, from: '08:00', to: '18:00' },
        wed: { open: true, from: '08:00', to: '18:00' },
        thu: { open: true, from: '08:00', to: '18:00' },
        fri: { open: true, from: '08:00', to: '18:00' },
        sat: { open: true, from: '09:00', to: '14:00' },
        sun: { open: false, from: '', to: '' },
      },
    },
    {
      label: 'Zima (říj–bře)',
      months: [10, 11, 12, 1, 2, 3],
      days: {
        mon: { open: true, from: '08:00', to: '16:00' },
        tue: { open: true, from: '08:00', to: '16:00' },
        wed: { open: true, from: '08:00', to: '16:00' },
        thu: { open: true, from: '08:00', to: '16:00' },
        fri: { open: true, from: '08:00', to: '16:00' },
        sat: { open: true, from: '09:00', to: '12:00' },
        sun: { open: false, from: '', to: '' },
      },
    },
  ],
  public_holidays: 'closed',
  access_type: 'full_grounds',
  access_note: '',
  note: '',
}

function parseData(raw: unknown): OpeningHoursData {
  if (!raw) return DEFAULT_HOURS
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as OpeningHoursData } catch { return DEFAULT_HOURS }
  }
  return raw as OpeningHoursData
}

interface Props {
  institution: {
    id: string
    opening_hours_structured?: unknown
    [key: string]: unknown
  }
}

const inputCls = 'px-3 py-2 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors bg-white'

export default function BusinessHoursForm({ institution }: Props) {
  const router = useRouter()
  const [data, setData] = useState<OpeningHoursData>(() =>
    parseData(institution.opening_hours_structured)
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ── helpers ── */
  const updateDay = (seasonIdx: number, day: DayKey, patch: Partial<DaySchedule>) => {
    setData(prev => {
      const seasons = prev.seasons.map((s, i) => {
        if (i !== seasonIdx) return s
        return { ...s, days: { ...s.days, [day]: { ...s.days[day], ...patch } } }
      })
      return { ...prev, seasons }
    })
  }

  const setBulk = (seasonIdx: number, days: DayKey[], from: string, to: string) => {
    setData(prev => {
      const seasons = prev.seasons.map((s, i) => {
        if (i !== seasonIdx) return s
        const newDays = { ...s.days }
        days.forEach(d => { newDays[d] = { open: true, from, to } })
        return { ...s, days: newDays }
      })
      return { ...prev, seasons }
    })
  }

  const setYearRound = (yearRound: boolean) => {
    if (yearRound) {
      setData(prev => ({ ...prev, year_round: true, seasons: [{ ...DEFAULT_HOURS.seasons[0] }] }))
    } else {
      setData(() => ({ ...SEASONAL_DEFAULT }))
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    const res = await fetch(`/api/institutions/${institution.id}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opening_hours_structured: data }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Chyba při ukládání'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Celoroční / Sezónní toggle */}
      <div className="bg-white rounded-lg p-5 border border-[#F0EDE8] shadow-sm">
        <h2 className="font-display font-extrabold text-lg text-[#2C1810] mb-4">Typ provozu</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setYearRound(true)}
            className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
              data.year_round
                ? 'bg-[#E8634A] text-white border-[#E8634A]'
                : 'bg-white text-[#A09890] border-[#F0EDE8] hover:border-[#E8634A]'
            }`}
          >
            Celoroční
          </button>
          <button
            type="button"
            onClick={() => setYearRound(false)}
            className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
              !data.year_round
                ? 'bg-[#E8634A] text-white border-[#E8634A]'
                : 'bg-white text-[#A09890] border-[#F0EDE8] hover:border-[#E8634A]'
            }`}
          >
            Sezónní (léto / zima)
          </button>
        </div>
      </div>

      {/* Sezóny */}
      {data.seasons.map((season, sIdx) => (
        <div key={sIdx} className="bg-white rounded-lg p-5 border border-[#F0EDE8] shadow-sm">
          <h2 className="font-display font-extrabold text-lg text-[#2C1810] mb-4">
            {season.label}
          </h2>

          {/* Hromadné nastavení */}
          <div className="flex flex-wrap gap-2 mb-4">
            <BulkButton
              label="Všední dny stejně"
              onApply={(from, to) => setBulk(sIdx, WEEKDAYS, from, to)}
            />
            <BulkButton
              label="Víkend stejně"
              onApply={(from, to) => setBulk(sIdx, WEEKEND, from, to)}
            />
          </div>

          {/* Dny */}
          <div>
            {DAY_KEYS.map(day => {
              const d = season.days[day] ?? DEFAULT_DAY_SCHEDULE
              return (
                <div key={day} className="flex items-center gap-3 py-2.5 border-b border-[#F0EDE8] last:border-0">
                  <input
                    type="checkbox"
                    checked={d.open}
                    onChange={e => updateDay(sIdx, day, { open: e.target.checked })}
                    className="w-4 h-4 accent-[#E8634A] cursor-pointer"
                  />
                  <span className="w-24 text-sm font-bold text-[#2C1810]">{DAY_LABELS[day]}</span>
                  {d.open ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={d.from}
                        onChange={e => updateDay(sIdx, day, { from: e.target.value })}
                        className={inputCls}
                      />
                      <span className="text-[#A09890] font-bold">–</span>
                      <input
                        type="time"
                        value={d.to}
                        onChange={e => updateDay(sIdx, day, { to: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-[#A09890]">Zavřeno</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Státní svátky */}
      <div className="bg-white rounded-lg p-5 border border-[#F0EDE8] shadow-sm">
        <h2 className="font-display font-extrabold text-lg text-[#2C1810] mb-4">Státní svátky</h2>
        <div className="space-y-2">
          {([
            ['closed',  'Zavřeno'],
            ['normal',  'Jako ostatní dny'],
            ['custom',  'Vlastní hodiny'],
          ] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="public_holidays"
                value={val}
                checked={data.public_holidays === val}
                onChange={() => setData(prev => ({ ...prev, public_holidays: val }))}
                className="accent-[#E8634A]"
              />
              <span className="text-sm font-semibold text-[#2C1810]">{label}</span>
            </label>
          ))}
        </div>
        {data.public_holidays === 'custom' && (
          <div className="mt-4 flex items-center gap-3">
            <input
              type="time"
              value={data.public_holidays_custom?.from ?? '09:00'}
              onChange={e => setData(prev => ({
                ...prev,
                public_holidays_custom: { from: e.target.value, to: prev.public_holidays_custom?.to ?? '13:00' }
              }))}
              className={inputCls}
            />
            <span className="text-[#A09890] font-bold">–</span>
            <input
              type="time"
              value={data.public_holidays_custom?.to ?? '13:00'}
              onChange={e => setData(prev => ({
                ...prev,
                public_holidays_custom: { from: prev.public_holidays_custom?.from ?? '09:00', to: e.target.value }
              }))}
              className={inputCls}
            />
          </div>
        )}
      </div>

      {/* Přístup */}
      <div className="bg-white rounded-lg p-5 border border-[#F0EDE8] shadow-sm">
        <h2 className="font-display font-extrabold text-lg text-[#2C1810] mb-4">Typ přístupu</h2>
        <div className="space-y-2">
          {([
            ['full_grounds',       'Celý areál'],
            ['office_only',        'Pouze kancelář'],
            ['appointment_only',   'Pouze na objednávku'],
          ] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="access_type"
                value={val}
                checked={data.access_type === val}
                onChange={() => setData(prev => ({ ...prev, access_type: val }))}
                className="accent-[#E8634A]"
              />
              <span className="text-sm font-semibold text-[#2C1810]">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className="text-xs font-bold text-[#8B6550] uppercase tracking-wider block mb-1.5">
            Upřesnění přístupu (volitelné)
          </label>
          <input
            type="text"
            value={data.access_note}
            onChange={e => setData(prev => ({ ...prev, access_note: e.target.value }))}
            placeholder="Např. vstup přes vrátnici, parkoviště u zadního vchodu…"
            className={`${inputCls} w-full`}
          />
        </div>
      </div>

      {/* Poznámka */}
      <div className="bg-white rounded-lg p-5 border border-[#F0EDE8] shadow-sm">
        <h2 className="font-display font-extrabold text-lg text-[#2C1810] mb-4">Poznámka</h2>
        <textarea
          value={data.note}
          onChange={e => setData(prev => ({ ...prev, note: e.target.value }))}
          placeholder="Např. V létě otevřeno i v neděli, o prázdninách zkrácená otevírací doba…"
          rows={3}
          className={`${inputCls} w-full resize-none`}
        />
      </div>

      {/* Zprávy + uložit */}
      {error && (
        <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-success-bg text-success text-sm font-semibold px-4 py-3 rounded-sm">
          ✓ Provozní doba byla uložena
        </div>
      )}
      <Button variant="primary" loading={loading} onClick={handleSave}>
        Uložit provozní dobu
      </Button>
    </div>
  )
}

/* ── BulkButton ── */
function BulkButton({ label, onApply }: { label: string; onApply: (from: string, to: string) => void }) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('08:00')
  const [to, setTo]     = useState('17:00')

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-[#E8634A] border border-[#E8634A]/30 bg-[#FAECE7] px-3 py-1.5 rounded-sm hover:bg-[#E8634A] hover:text-white transition-all"
      >
        {label}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-bold text-[#2C1810]">{label}:</span>
      <input type="time" value={from} onChange={e => setFrom(e.target.value)}
        className="px-2 py-1 border border-[#F0EDE8] rounded text-xs text-[#2C1810] outline-none focus:border-[#E8634A]" />
      <span className="text-[#A09890]">–</span>
      <input type="time" value={to} onChange={e => setTo(e.target.value)}
        className="px-2 py-1 border border-[#F0EDE8] rounded text-xs text-[#2C1810] outline-none focus:border-[#E8634A]" />
      <button
        type="button"
        onClick={() => { onApply(from, to); setOpen(false) }}
        className="text-xs font-bold text-white bg-[#E8634A] px-3 py-1 rounded-sm hover:opacity-80 transition-opacity"
      >
        Použít
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs font-semibold text-[#A09890] hover:text-[#2C1810] transition-colors"
      >
        Zrušit
      </button>
    </div>
  )
}
