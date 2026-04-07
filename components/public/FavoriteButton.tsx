'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  type:       'animal' | 'institution'
  id:         string
  initialFav?: boolean
  size?:      'sm' | 'md'
  className?: string
}

export function FavoriteButton({ type, id, initialFav = false, size = 'md', className = '' }: FavoriteButtonProps) {
  const router = useRouter()
  const [fav,     setFav]     = useState(initialFav)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)

    const endpoint = type === 'animal'
      ? '/api/favorites/animals'
      : '/api/favorites/institutions'

    const key = type === 'animal' ? 'animal_id' : 'institution_id'

    const res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ [key]: id }),
    })

    if (res.status === 401) {
      // Nepřihlášen — přesměruj na login
      router.push(`/auth/login?next=${window.location.pathname}`)
      setLoading(false)
      return
    }

    const data = await res.json()
    setFav(data.favorited)
    setLoading(false)
  }

  if (!mounted) return null

  const isSmall = size === 'sm'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={fav ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
      className={`flex items-center justify-center rounded-full border-none cursor-pointer transition-all ${
        loading ? 'opacity-50' : 'hover:scale-110'
      } ${className}`}
      style={{
        width:      isSmall ? 32 : 44,
        height:     isSmall ? 32 : 44,
        background: fav ? '#FAECE7' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(4px)',
        boxShadow:  '0 1px 4px rgba(0,0,0,0.12)',
      }}
    >
      <svg
        width={isSmall ? 14 : 20}
        height={isSmall ? 14 : 20}
        viewBox="0 0 24 24"
        fill={fav ? '#E8634A' : 'none'}
        stroke={fav ? '#E8634A' : '#8B6550'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
