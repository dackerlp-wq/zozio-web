'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params:    Record<string, string | undefined>
  hasLoc:    boolean
  cancelUrl: string
}

function buildUrl(params: any, overrides: Record<string, string | undefined>) {
  const next = { ...params, ...overrides }
  const qs   = new URLSearchParams()
  Object.entries(next).forEach(([k, v]) => { if (v) qs.set(k, v as string) })
  const str = qs.toString()
  return `/institutions${str ? `?${str}` : ''}`
}

export function InstitutionGpsButton({ params, hasLoc, cancelUrl }: Props) {
  const [loading, setLoading] = useState(false)
  const [denied,  setDenied]  = useState(false)
  const router = useRouter()

  const handleGps = () => {
    if (!navigator.geolocation) return
    setLoading(true)
    setDenied(false)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLoading(false)
        router.push(buildUrl(params, {
          lat:  pos.coords.latitude.toFixed(4),
          lng:  pos.coords.longitude.toFixed(4),
          page: undefined,
        }))
      },
      () => { setLoading(false); setDenied(true) },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    )
  }

  if (hasLoc) {
    return (
      <Link href={cancelUrl}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold no-underline border transition-all hover:opacity-80 flex-shrink-0"
        style={{ borderColor: '#BDE8D0', color: '#0F6E56', background: '#E1F5EE' }}>
        📍 Z vašeho okolí · zrušit ✕
      </Link>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleGps}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border-none cursor-pointer transition-all flex-shrink-0"
        style={{ background: loading ? '#F0EDE8' : '#E8634A', color: loading ? '#8B6550' : 'white', opacity: loading ? 0.8 : 1 }}>
        {loading ? '⏳ Zjišťuji polohu…' : '📍 Najít nejbližší'}
      </button>
      {denied && (
        <span className="text-[11px]" style={{ color: '#993C1D' }}>
          Přístup k poloze zamítnut — povol ho v prohlížeči.
        </span>
      )}
    </div>
  )
}
