'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Ad, AdSlotType } from '@/types/database'

interface AdSlotProps {
  slot:      AdSlotType
  speciesId?: string
  /** GPS souřadnice pro lokální cílení reklam */
  lat?:      string | number
  lng?:      string | number
  className?: string
}

function trackEvent(adId: string, event: 'impression' | 'click', slot: string) {
  fetch(`/api/ads/${adId}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, slot }),
  }).catch(() => {})
}

/* ── Vizuál karty (inline_grid, sidebar) ── */
function AdCard({ ad, slot }: { ad: Ad; slot: AdSlotType }) {
  return (
    <a
      href={ad.cta_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => trackEvent(ad.id, 'click', slot)}
      className="block rounded-xl border no-underline transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group overflow-hidden"
      style={{ borderColor: '#F0EDE8', background: 'white' }}>

      {/* Obrázek banneru */}
      {ad.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.image_url} alt={ad.headline}
          className="w-full object-cover"
          style={{ maxHeight: slot === 'sidebar' ? '140px' : '96px' }} />
      )}

      <div className="p-4">
        {/* Header: logo + sponsor label */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {ad.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.logo_url} alt={ad.company_name} className="h-8 w-8 object-contain rounded flex-shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: '#F0EDE8', color: '#8B6550' }}>
                {ad.company_name.charAt(0)}
              </div>
            )}
            <span className="text-xs font-bold truncate" style={{ color: '#2C1810' }}>
              {ad.company_name}
            </span>
          </div>
          <span className="text-[10px] font-semibold flex-shrink-0 px-1.5 py-0.5 rounded"
            style={{ color: '#A89080', background: '#F0EDE8' }}>
            Sponzor
          </span>
        </div>

        {/* Headline + popis */}
        <p className="text-sm font-bold leading-snug mb-1" style={{ color: '#2C1810' }}>
          {ad.headline}
        </p>
        {ad.description && (
          <p className="text-xs leading-relaxed mb-3" style={{ color: '#8B6550' }}>
            {ad.description}
          </p>
        )}

        {/* CTA */}
        <div className="flex justify-end">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all group-hover:opacity-90"
            style={{ background: '#E8634A' }}>
            {ad.cta_label}
          </span>
        </div>
      </div>
    </a>
  )
}

/* ── Vizuál horizontálního banneru (banner_*) ── */
function AdBanner({ ad, slot }: { ad: Ad; slot: AdSlotType }) {
  return (
    <a
      href={ad.cta_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => trackEvent(ad.id, 'click', slot)}
      className="flex items-center gap-4 px-5 py-3 rounded-xl border no-underline transition-all duration-200 hover:shadow-sm group"
      style={{ borderColor: '#F0EDE8', background: 'white' }}>
      <span className="text-[10px] font-semibold whitespace-nowrap flex-shrink-0 px-1.5 py-1 rounded"
        style={{ color: '#A89080', background: '#F0EDE8' }}>
        Sponzor
      </span>
      {ad.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.logo_url} alt={ad.company_name} className="h-8 w-auto object-contain flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-bold" style={{ color: '#2C1810' }}>{ad.headline}</span>
        {ad.description && (
          <span className="ml-2 text-xs hidden sm:inline" style={{ color: '#8B6550' }}>
            — {ad.description}
          </span>
        )}
      </div>
      <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold text-white flex-shrink-0 transition-all group-hover:opacity-90"
        style={{ background: '#E8634A' }}>
        {ad.cta_label}
      </span>
    </a>
  )
}

/* ── Google AdSense placeholder ── */
function AdSensePlaceholder({ slot }: { slot: AdSlotType }) {
  const isCard = slot === 'inline_grid' || slot === 'sidebar'
  return (
    <div className="flex items-center justify-center rounded-xl border-2 border-dashed text-xs font-medium"
      style={{
        borderColor: '#E0DDD8',
        color: '#B8AEA8',
        minHeight: isCard ? '160px' : '52px',
        background: '#FAFAF9',
      }}>
      Google Ads
    </div>
  )
}

/* ── Hlavní komponenta ── */
export function AdSlot({ slot, speciesId, lat, lng, className }: AdSlotProps) {
  const [ads, setAds]           = useState<Ad[] | null>(null)
  const [displayed, setDisplayed] = useState<Ad | null>(null)
  const [visible, setVisible]   = useState(false)
  const ref        = useRef<HTMLDivElement>(null)
  const trackedRef = useRef(false)

  // Fetch reklamy
  useEffect(() => {
    const url = new URL('/api/ads', window.location.origin)
    url.searchParams.set('slot', slot)
    if (speciesId) url.searchParams.set('species', speciesId)
    if (lat)       url.searchParams.set('lat', String(lat))
    if (lng)       url.searchParams.set('lng', String(lng))

    fetch(url.toString())
      .then(r => r.json())
      .then((data: Ad[]) => {
        setAds(data)
        if (data.length > 0) {
          // Zobrazit náhodnou z top 3 (při více stejného tieru)
          const pick = data[Math.floor(Math.random() * Math.min(data.length, 3))]
          setDisplayed(pick)
        }
      })
      .catch(() => setAds([]))
  }, [slot, speciesId, lat, lng])

  // IntersectionObserver — impression tracking (50% viditelnosti)
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting && displayed && !trackedRef.current) {
      trackedRef.current = true
      trackEvent(displayed.id, 'impression', slot)
    }
  }, [displayed, slot])

  useEffect(() => {
    if (!displayed || !ref.current) return
    trackedRef.current = false
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.5 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [displayed, handleIntersect])

  // Fade-in po načtení
  useEffect(() => {
    if (ads !== null) {
      const t = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(t)
    }
  }, [ads])

  const isCard   = slot === 'inline_grid' || slot === 'sidebar'
  const isBanner = slot === 'banner_adopt' || slot === 'banner_home' || slot === 'banner_animal'

  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}>

      {/* Loading skeleton */}
      {ads === null && (
        <div className="rounded-xl animate-pulse" style={{
          background: '#F0EDE8',
          minHeight: isCard ? '160px' : '52px',
        }} />
      )}

      {/* Reklama */}
      {ads !== null && displayed && isCard   && <AdCard   ad={displayed} slot={slot} />}
      {ads !== null && displayed && isBanner && <AdBanner ad={displayed} slot={slot} />}

      {/* Fallback: Google AdSense */}
      {ads !== null && !displayed && <AdSensePlaceholder slot={slot} />}
    </div>
  )
}
