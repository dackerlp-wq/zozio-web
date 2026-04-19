'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FavoriteButton } from '@/components/public/FavoriteButton'

interface Institution {
  id:              string
  name:            string
  slug:            string
  type:            string
  city:            string
  lat:             number | null
  lng:             number | null
  logo_url:        string | null
  approval_status: string
}

interface NearbyInstitutionsProps {
  institutions: Institution[]
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R   = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a   =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

type Status = 'idle' | 'loading' | 'ok' | 'denied' | 'unavailable'

export function NearbyInstitutions({ institutions }: NearbyInstitutionsProps) {
  const [status,   setStatus]   = useState<Status>('idle')
  const [userPos,  setUserPos]  = useState<{ lat: number; lng: number } | null>(null)
  const [sorted,   setSorted]   = useState<(Institution & { distKm: number | null })[]>([])
  const [showAll,  setShowAll]  = useState(false)

  // Vypočítej vzdálenosti kdykoliv se změní pozice
  useEffect(() => {
    const withDist = institutions.map(inst => ({
      ...inst,
      distKm: (userPos && inst.lat && inst.lng)
        ? haversineKm(userPos.lat, userPos.lng, inst.lat, inst.lng)
        : null,
    }))

    // Seřaď — instituce se vzdáleností první, pak ostatní
    withDist.sort((a, b) => {
      if (a.distKm !== null && b.distKm !== null) return a.distKm - b.distKm
      if (a.distKm !== null) return -1
      if (b.distKm !== null) return 1
      return a.name.localeCompare(b.name, 'cs')
    })

    setSorted(withDist)
  }, [userPos, institutions])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('ok')
      },
      () => setStatus('denied'),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    )
  }

  const displayed = showAll ? sorted : sorted.slice(0, 6)
  const withGeo   = institutions.filter(i => i.lat && i.lng).length

  return (
    <div>
      {/* ── Geolokace banner ── */}
      {status === 'idle' && withGeo > 0 && (
        <div className="mb-6 p-4 rounded-2xl flex items-center gap-4 border border-[#F0DDD6] bg-warm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-coral-tag-bg">
            📍
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-text-primary">Najít nejbližší útulek</div>
            <div className="text-xs mt-0.5 text-text-muted">
              Zobrazíme útulky seřazené podle vzdálenosti od tebe.
            </div>
          </div>
          <button
            onClick={requestLocation}
            className="px-4 py-2 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:opacity-90 transition-all flex-shrink-0 bg-coral">
            Zjistit polohu
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 border border-[#F0DDD6] bg-warm">
          <div className="w-5 h-5 border-2 rounded-full animate-spin flex-shrink-0 border-coral border-t-transparent" />
          <span className="text-sm font-medium text-text-muted">
            Zjišťuji tvoji polohu...
          </span>
        </div>
      )}

      {status === 'ok' && (
        <div className="mb-6 p-3 rounded-xl flex items-center gap-3 bg-success-tag-bg border border-[#BDE8D0]">
          <span>✓</span>
          <span className="text-sm font-semibold text-success-tag-text">
            Útulky seřazeny podle vzdálenosti od tebe
          </span>
          <button
            onClick={() => { setUserPos(null); setStatus('idle') }}
            className="ml-auto text-xs cursor-pointer bg-transparent border-none font-bold text-success-tag-text">
            Zrušit
          </button>
        </div>
      )}

      {status === 'denied' && (
        <div className="mb-6 p-3 rounded-xl flex items-center gap-3 bg-coral-tag-bg border border-[#F0DDD6]">
          <span>⚠️</span>
          <span className="text-sm font-medium text-coral-tag-text">
            Přístup k poloze byl zamítnut. Povol ho v nastavení prohlížeče.
          </span>
          <button
            onClick={() => setStatus('idle')}
            className="ml-auto text-xs cursor-pointer bg-transparent border-none text-coral-tag-text">
            ✕
          </button>
        </div>
      )}

      {status === 'unavailable' && (
        <div className="mb-6 p-3 rounded-xl bg-border">
          <span className="text-sm text-text-body">
            Geolokace není v tomto prohlížeči dostupná.
          </span>
        </div>
      )}

      {/* ── Grid institucí ── */}
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏠</div>
          <p className="font-bold text-xl text-text-primary mb-2">Žádné útulky nenalezeny</p>
          <p className="text-sm text-text-muted">Zkus jiné hledání nebo filtr.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map(inst => (
              <InstitutionCard key={inst.id} inst={inst} />
            ))}
          </div>

          {sorted.length > 6 && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm border cursor-pointer hover:opacity-80 transition-all border-[#E0DDD8] text-text-body bg-white">
                {showAll ? 'Zobrazit méně ↑' : `Zobrazit všech ${sorted.length} útulků ↓`}
              </button>
            </div>
          )}
        </>
      )}

      {/* CTA pro registraci */}
      <div className="mt-14 p-6 rounded-2xl text-center border border-dashed border-[#E0DDD8] bg-warm-hover">
        <p className="font-bold text-text-primary mb-1">Chybí zde váš útulek?</p>
        <p className="text-sm mb-4 text-text-muted">
          Registrace je zdarma a trvá 5 minut.
        </p>
        <Link href="/auth/register?type=shelter">
          <button className="px-5 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:opacity-90 transition-all bg-coral">
            Registrovat útulek →
          </button>
        </Link>
      </div>
    </div>
  )
}

/* ── Karta instituce ── */
function InstitutionCard({ inst }: { inst: Institution & { distKm: number | null } }) {
  return (
    <div className="relative group">
      <Link href={`/institutions/${inst.slug}`} className="no-underline">
        <div className="bg-white rounded-2xl overflow-hidden border border-border hover:-translate-y-1 transition-all duration-200 h-full flex flex-col"
          style={{ borderTop: '3px solid var(--coral)' }}>

          {/* Cover oblast */}
          <div className="relative h-28 flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--coral-tag-bg), white)' }}>
            {/* Logo */}
            <div className="relative z-10 w-16 h-16 rounded-lg border-2 border-white shadow-sm flex items-center justify-center text-2xl overflow-hidden"
              style={{ background: 'var(--coral-tag-bg)' }}>
              {inst.logo_url
                ? <Image src={inst.logo_url} alt={inst.name} width={64} height={64} className="object-cover" />
                : <span>🏠</span>
              }
            </div>

            {/* Vzdálenost badge */}
            {inst.distKm !== null && (
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 bg-text-primary text-white">
                📍 {formatKm(inst.distKm)}
              </div>
            )}

            {/* ❤️ Favorite button */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <FavoriteButton type="institution" id={inst.id} size="sm" />
            </div>
          </div>

          {/* Info */}
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'var(--coral-tag-bg)', color: 'var(--coral-tag-text)' }}>
                🏠 Útulek
              </span>
              {inst.approval_status === 'approved' && (
                <span className="text-[10px] font-bold text-success-tag-text">✓ Ověřeno</span>
              )}
            </div>

            <div className="font-bold text-text-primary leading-tight mb-1 group-hover:opacity-80 transition-opacity">
              {inst.name}
            </div>
            <div className="text-xs text-text-muted">
              📍 {inst.city}
              {inst.distKm !== null && (
                <span className="ml-2 font-semibold" style={{ color: 'var(--coral)' }}>
                  · {formatKm(inst.distKm)} od tebe
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
