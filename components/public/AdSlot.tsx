'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Ad, AdSlotType } from '@/types/database'

interface AdSlotProps {
  slot:      AdSlotType
  speciesId?: string
  lat?:      string | number
  lng?:      string | number
  institutionId?: string
  articleCategory?: string
  className?: string
}

function trackEvent(adId: string, event: 'impression' | 'click', slot: string) {
  fetch(`/api/ads/${adId}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, slot }),
  }).catch(() => {})
}

/* ─────────────────────────────────────────────────────────────────────────────
   AdCard — inline_grid / sidebar
   Vizuální karta s obrázkem, logem, textem a CTA tlačítkem.
───────────────────────────────────────────────────────────────────────────── */
function AdCard({ ad, slot }: { ad: Ad; slot: AdSlotType }) {
  const isSidebar = slot === 'sidebar'
  return (
    <a
      href={ad.cta_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => trackEvent(ad.id, 'click', slot)}
      className="block rounded-2xl border no-underline overflow-hidden group"
      style={{
        borderColor: '#EDEBE6',
        background: 'white',
        boxShadow: '0 1px 4px rgba(44,24,16,0.06)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(44,24,16,0.12)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(44,24,16,0.06)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Obrázek */}
      {ad.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="relative overflow-hidden" style={{ aspectRatio: isSidebar ? '16/7' : '16/6' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.image_url}
            alt={ad.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Sponzor label přes obrázek */}
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.88)', color: '#8B6550', backdropFilter: 'blur(4px)' }}>
            Sponzor
          </span>
        </div>
      ) : (
        /* Bez obrázku — barevný gradient header */
        <div className="relative flex items-center justify-center" style={{ height: isSidebar ? 72 : 56, background: 'linear-gradient(135deg, #FAECE7 0%, #FEF9E7 100%)' }}>
          <span className="text-2xl">
            {ad.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={ad.logo_url} alt="" className="h-8 object-contain" />
              : '📣'}
          </span>
          <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.8)', color: '#8B6550' }}>
            Sponzor
          </span>
        </div>
      )}

      <div className="p-3.5">
        {/* Logo + firma */}
        <div className="flex items-center gap-2 mb-2">
          {ad.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.logo_url} alt={ad.company_name}
              className="h-6 w-6 object-contain rounded-md flex-shrink-0"
              style={{ border: '1px solid #F0EDE8' }} />
          ) : (
            <div className="h-6 w-6 rounded-md flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
              style={{ background: '#F0EDE8', color: '#8B6550' }}>
              {ad.company_name.charAt(0)}
            </div>
          )}
          <span className="text-[11px] font-semibold truncate" style={{ color: '#8B6550' }}>
            {ad.company_name}
          </span>
        </div>

        {/* Headline */}
        <p className="font-display font-bold leading-snug mb-1"
          style={{ fontSize: 14, color: '#1A0F0A', lineHeight: 1.35 }}>
          {ad.headline}
        </p>

        {/* Popis */}
        {ad.description && (
          <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: '#8B6550' }}>
            {ad.description}
          </p>
        )}

        {/* CTA */}
        <div className="w-full flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-white transition-opacity group-hover:opacity-90"
          style={{ background: '#E8634A' }}>
          {ad.cta_label}
          <span style={{ fontSize: 10 }}>→</span>
        </div>
      </div>
    </a>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   AdBanner — banner_adopt / banner_home / banner_animal
   Horizontální proužek, mobilně se skládá do 2 řádků.
───────────────────────────────────────────────────────────────────────────── */
function AdBanner({ ad, slot }: { ad: Ad; slot: AdSlotType }) {
  return (
    <a
      href={ad.cta_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => trackEvent(ad.id, 'click', slot)}
      className="flex items-center gap-3 no-underline group rounded-2xl border overflow-hidden"
      style={{
        borderColor: '#EDEBE6',
        background: 'white',
        boxShadow: '0 1px 4px rgba(44,24,16,0.06)',
        transition: 'box-shadow 0.2s',
        padding: '10px 14px',
      }}
      onMouseEnter={e => { ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(44,24,16,0.1)' }}
      onMouseLeave={e => { ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(44,24,16,0.06)' }}
    >
      {/* Logo */}
      {ad.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.logo_url} alt={ad.company_name}
          className="h-9 w-9 object-contain rounded-lg flex-shrink-0"
          style={{ border: '1px solid #F0EDE8' }} />
      ) : (
        <div className="h-9 w-9 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold"
          style={{ background: '#FAECE7', color: '#E8634A' }}>
          {ad.company_name.charAt(0)}
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: '#F0EDE8', color: '#A89080' }}>
            Sponzor
          </span>
          <span className="text-[10px] font-semibold truncate" style={{ color: '#A89080' }}>
            {ad.company_name}
          </span>
        </div>
        <p className="text-sm font-bold truncate" style={{ color: '#1A0F0A' }}>{ad.headline}</p>
        {ad.description && (
          <p className="text-xs truncate hidden sm:block" style={{ color: '#8B6550' }}>{ad.description}</p>
        )}
      </div>

      {/* CTA */}
      <span className="flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap transition-opacity group-hover:opacity-90"
        style={{ background: '#E8634A' }}>
        {ad.cta_label}
        <span style={{ fontSize: 10 }}>→</span>
      </span>
    </a>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Skeleton — zobrazí se při načítání
───────────────────────────────────────────────────────────────────────────── */
function AdSkeleton({ slot }: { slot: AdSlotType }) {
  const isCard = slot === 'inline_grid' || slot === 'sidebar'
  if (isCard) {
    return (
      <div className="rounded-2xl border overflow-hidden animate-pulse" style={{ borderColor: '#EDEBE6', background: 'white' }}>
        <div style={{ height: 80, background: '#F5F2EE' }} />
        <div className="p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md" style={{ background: '#EDEBE6' }} />
            <div className="h-3 w-24 rounded" style={{ background: '#EDEBE6' }} />
          </div>
          <div className="h-4 w-full rounded" style={{ background: '#EDEBE6' }} />
          <div className="h-3 w-3/4 rounded" style={{ background: '#EDEBE6' }} />
          <div className="h-8 w-full rounded-xl mt-1" style={{ background: '#F5F2EE' }} />
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border animate-pulse flex items-center gap-3 p-3"
      style={{ borderColor: '#EDEBE6', background: 'white' }}>
      <div className="h-9 w-9 rounded-lg flex-shrink-0" style={{ background: '#F5F2EE' }} />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-1/3 rounded" style={{ background: '#EDEBE6' }} />
        <div className="h-4 w-2/3 rounded" style={{ background: '#EDEBE6' }} />
      </div>
      <div className="h-8 w-20 rounded-xl flex-shrink-0" style={{ background: '#F5F2EE' }} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hlavní komponenta
───────────────────────────────────────────────────────────────────────────── */
export function AdSlot({ slot, speciesId, lat, lng, institutionId, articleCategory, className }: AdSlotProps) {
  const [ads, setAds]             = useState<Ad[] | null>(null)
  const [displayed, setDisplayed] = useState<Ad | null>(null)
  const [visible, setVisible]     = useState(false)
  const ref        = useRef<HTMLDivElement>(null)
  const trackedRef = useRef(false)

  useEffect(() => {
    const url = new URL('/api/ads', window.location.origin)
    url.searchParams.set('slot', slot)
    if (speciesId)       url.searchParams.set('species', speciesId)
    if (lat)             url.searchParams.set('lat', String(lat))
    if (lng)             url.searchParams.set('lng', String(lng))
    if (institutionId)   url.searchParams.set('institutionId', institutionId)
    if (articleCategory) url.searchParams.set('articleCategory', articleCategory)

    fetch(url.toString())
      .then(r => r.json())
      .then((data: Ad[]) => {
        setAds(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length > 0) {
          // Náhodný výběr z top 3 (fair rotation při stejném skóre)
          const pick = data[Math.floor(Math.random() * Math.min(data.length, 3))]
          setDisplayed(pick)
        }
      })
      .catch(() => setAds([]))
  }, [slot, speciesId, lat, lng, institutionId, articleCategory])

  // Impression tracking (50% viditelnosti po 1s)
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

  // Fade-in
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
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease' }}
    >
      {/* Skeleton */}
      {ads === null && <AdSkeleton slot={slot} />}

      {/* Reklama */}
      {ads !== null && displayed && isCard   && <AdCard   ad={displayed} slot={slot} />}
      {ads !== null && displayed && isBanner && <AdBanner ad={displayed} slot={slot} />}

      {/* Prázdný stav — nic nezobrazujeme (Google AdSense by šel sem) */}
      {ads !== null && !displayed && null}
    </div>
  )
}
