'use client'

import { useMemo, useState } from 'react'

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

export interface OpeningHoursData {
  year_round: boolean
  seasons: SeasonSchedule[]
  public_holidays: 'closed' | 'normal' | 'custom'
  public_holidays_custom?: { from: string; to: string }
  access_type: 'full_grounds' | 'office_only' | 'appointment_only'
  access_note?: string
  note?: string
}

const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Pondělí',
  tue: 'Úterý',
  wed: 'Středa',
  thu: 'Čtvrtek',
  fri: 'Pátek',
  sat: 'Sobota',
  sun: 'Neděle',
}

// Mapa JS getDay() (0=Ne, 1=Po, ..., 6=So) → DayKey
const JS_DAY_TO_KEY: Record<number, DayKey> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

const ACCESS_LABELS: Record<OpeningHoursData['access_type'], string> = {
  full_grounds:     'Přístup do celého areálu',
  office_only:      'Pouze v kanceláři',
  appointment_only: 'Pouze na objednávku',
}

const HOLIDAY_LABELS: Record<OpeningHoursData['public_holidays'], string> = {
  closed: 'Zavřeno',
  normal: 'Jako ostatní dny',
  custom: 'Vlastní hodiny',
}

function parseData(raw: unknown): OpeningHoursData | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as OpeningHoursData } catch { return null }
  }
  const parsed = raw as Partial<OpeningHoursData>
  if (!parsed.seasons || !Array.isArray(parsed.seasons) || parsed.seasons.length === 0) return null
  return raw as OpeningHoursData
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function findCurrentSeason(seasons: SeasonSchedule[], monthIdx: number): SeasonSchedule {
  // month is 1-12
  const seasonal = seasons.find(s => s.months.length > 0 && s.months.includes(monthIdx))
  if (seasonal) return seasonal
  const yearRound = seasons.find(s => s.months.length === 0)
  return yearRound ?? seasons[0]
}

function computeStatus(season: SeasonSchedule, now: Date): {
  open: boolean
  closesAt?: string
  opensAt?: { day: DayKey; time: string; isToday: boolean }
} {
  const todayKey = JS_DAY_TO_KEY[now.getDay()]
  const today = season.days[todayKey]
  const nowMin = now.getHours() * 60 + now.getMinutes()

  if (today?.open && today.from && today.to) {
    const fromMin = timeToMinutes(today.from)
    const toMin = timeToMinutes(today.to)
    if (nowMin >= fromMin && nowMin < toMin) {
      return { open: true, closesAt: today.to }
    }
    if (nowMin < fromMin) {
      return { open: false, opensAt: { day: todayKey, time: today.from, isToday: true } }
    }
  }

  // Hledáme další otevřený den v týdnu (max 7 dní dopředu)
  const startIdx = DAY_ORDER.indexOf(todayKey)
  for (let i = 1; i <= 7; i++) {
    const nextIdx = (startIdx + i) % 7
    const nextKey = DAY_ORDER[nextIdx]
    const d = season.days[nextKey]
    if (d?.open && d.from) {
      return { open: false, opensAt: { day: nextKey, time: d.from, isToday: false } }
    }
  }
  return { open: false }
}

function monthsLabel(months: number[]): string {
  if (months.length === 0) return 'Celoročně'
  const names = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro']
  // Detekce souvislého pásma 1-12 → první–poslední
  const sorted = [...months].sort((a, b) => a - b)
  return sorted.map(m => names[m - 1]).join(' · ')
}

interface Props {
  data: unknown  // opening_hours_structured z DB
  fallbackText?: string | null
}

export function OpeningHoursDisplay({ data, fallbackText }: Props) {
  const parsed = parseData(data)
  const [showAllSeasons, setShowAllSeasons] = useState(false)

  const { season, status, now } = useMemo(() => {
    if (!parsed) return { season: null, status: null, now: new Date() }
    const n = new Date()
    const s = findCurrentSeason(parsed.seasons, n.getMonth() + 1)
    return { season: s, status: computeStatus(s, n), now: n }
  }, [parsed])

  // Žádná strukturovaná data — vykresli fallback text
  if (!parsed || !season || !status) {
    if (!fallbackText) return null
    return (
      <div className="bg-white rounded-xl border border-[#F0EDE8] p-5">
        <h3 className="font-bold text-sm text-[#1A0F0A] mb-3">🕐 Provozní hodiny</h3>
        <p className="text-sm text-[#4A2C1A] whitespace-pre-line leading-relaxed">
          {fallbackText}
        </p>
      </div>
    )
  }

  const todayKey = JS_DAY_TO_KEY[now.getDay()]
  const otherSeasons = parsed.seasons.filter(s => s !== season)

  return (
    <div className="bg-white rounded-xl border border-[#F0EDE8] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="font-bold text-sm text-[#1A0F0A]">🕐 Provozní hodiny</h3>
        <StatusBadge status={status} />
      </div>

      {/* Sezónní hlavička */}
      {!parsed.year_round && (
        <div className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#8B6550' }}>
          {season.label} <span className="font-normal normal-case">· {monthsLabel(season.months)}</span>
        </div>
      )}

      {/* Dny */}
      <div className="space-y-1.5">
        {DAY_ORDER.map(key => {
          const d = season.days[key]
          const isToday = key === todayKey
          return (
            <div
              key={key}
              className={`flex items-center justify-between text-sm py-1 ${
                isToday ? 'font-bold text-[#1A0F0A]' : 'text-[#4A2C1A]'
              }`}>
              <span className="flex items-center gap-2">
                {isToday && (
                  <span className="inline-block w-1 h-4 rounded-full" style={{ background: '#E8634A' }} />
                )}
                {DAY_LABELS[key]}
              </span>
              <span className={d?.open ? '' : 'text-[#A08070]'}>
                {d?.open && d.from && d.to ? `${d.from} – ${d.to}` : 'Zavřeno'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Ostatní sezóny */}
      {otherSeasons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#F0EDE8]">
          <button
            type="button"
            onClick={() => setShowAllSeasons(v => !v)}
            className="text-xs font-bold text-[#E8634A] hover:opacity-80 transition-opacity">
            {showAllSeasons ? '− Skrýt ostatní sezóny' : `+ Zobrazit ostatní sezóny (${otherSeasons.length})`}
          </button>
          {showAllSeasons && (
            <div className="mt-3 space-y-4">
              {otherSeasons.map((s, i) => (
                <div key={i}>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#8B6550' }}>
                    {s.label} <span className="font-normal normal-case">· {monthsLabel(s.months)}</span>
                  </div>
                  <div className="space-y-1">
                    {DAY_ORDER.map(key => {
                      const d = s.days[key]
                      return (
                        <div key={key} className="flex items-center justify-between text-xs text-[#4A2C1A] py-0.5">
                          <span>{DAY_LABELS[key]}</span>
                          <span className={d?.open ? '' : 'text-[#A08070]'}>
                            {d?.open && d.from && d.to ? `${d.from} – ${d.to}` : 'Zavřeno'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Svátky + přístup + poznámka */}
      <div className="mt-4 pt-4 border-t border-[#F0EDE8] space-y-2 text-xs">
        <InfoLine
          icon="🎉"
          label="Státní svátky"
          value={
            parsed.public_holidays === 'custom' && parsed.public_holidays_custom
              ? `${parsed.public_holidays_custom.from} – ${parsed.public_holidays_custom.to}`
              : HOLIDAY_LABELS[parsed.public_holidays]
          }
        />
        <InfoLine
          icon="🚪"
          label="Přístup"
          value={ACCESS_LABELS[parsed.access_type]}
          note={parsed.access_note || undefined}
        />
        {parsed.note && (
          <div className="pt-2 text-sm text-[#4A2C1A] whitespace-pre-line leading-relaxed">
            {parsed.note}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ReturnType<typeof computeStatus> }) {
  if (status.open) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
        style={{ background: '#E7F5E3', color: '#2D7A1F' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#2D7A1F' }} />
        Otevřeno{status.closesAt ? ` · zavíráme ${status.closesAt}` : ''}
      </span>
    )
  }
  if (status.opensAt) {
    const dayLabel = status.opensAt.isToday ? 'dnes' : DAY_LABELS[status.opensAt.day].toLowerCase()
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
        style={{ background: '#FAECE7', color: '#A03E28' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#A03E28' }} />
        Zavřeno · otevírá {dayLabel} {status.opensAt.time}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
      style={{ background: '#F5F0EB', color: '#6B4030' }}>
      Zavřeno
    </span>
  )
}

function InfoLine({ icon, label, value, note }: { icon: string; label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <span className="font-bold text-[#1A0F0A]">{label}:</span>{' '}
        <span className="text-[#4A2C1A]">{value}</span>
        {note && <div className="text-[#8B6550] mt-0.5">{note}</div>}
      </div>
    </div>
  )
}
