'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VolunteerRegisterModal } from '@/components/public/VolunteerRegisterModal'

interface Institution {
  id: string
  name: string
  slug: string
  type: 'shelter' | 'rescue_station'
  city: string
  logo_url: string | null
}

interface Props {
  institution: Institution
  initialFav: boolean
  volunteerStatus: 'none' | 'pending' | 'active' | 'rejected'
  isLoggedIn: boolean
  userEmail: string
  userName: string
}

const volunteerStatusConfig = {
  none:     null,
  pending:  { label: 'Přihláška čeká',  bg: '#FAEEDA', color: '#854F0B', icon: '⏳' },
  active:   { label: 'Jsem dobrovolník', bg: '#EAF3DE', color: '#3B6D11', icon: '✓' },
  rejected: { label: 'Přihláška zamítnuta', bg: '#FAECE7', color: '#993C1D', icon: '✗' },
}

export function InstitutionActions({ institution, initialFav, volunteerStatus, isLoggedIn, userEmail, userName }: Props) {
  const router = useRouter()
  const [fav, setFav]           = useState(initialFav)
  const [favLoading, setFavLoading] = useState(false)
  const [showModal, setShowModal]   = useState(false)
  const [volStatus, setVolStatus]   = useState(volunteerStatus)

  async function toggleFav() {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=${window.location.pathname}`)
      return
    }
    setFavLoading(true)
    const res = await fetch('/api/favorites/institutions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ institution_id: institution.id }),
    })
    if (res.ok) {
      const data = await res.json()
      setFav(data.favorited)
    }
    setFavLoading(false)
  }

  function handleVolunteerClick() {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=${window.location.pathname}`)
      return
    }
    setShowModal(true)
  }

  const volConfig = volunteerStatusConfig[volStatus]

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">

        {/* ── Sledovat (oblíbená) ── */}
        {/* ── Sledovat ── */}
        <button
          onClick={toggleFav}
          disabled={favLoading}
          className="flex items-center gap-1.5 rounded-[100px] font-bold border transition-all disabled:opacity-50
                     px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
          style={fav
            ? { background: 'rgba(250,236,231,0.95)', borderColor: '#E8634A', color: '#993C1D' }
            : { background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.5)', color: 'white',
                backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }
          }
          aria-label={fav ? 'Přestat sledovat' : 'Sledovat instituci'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={fav ? '#E8634A' : 'none'}
            stroke={fav ? '#E8634A' : 'white'}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="hidden sm:inline">{fav ? 'Sleduji' : 'Sledovat'}</span>
        </button>

        {/* ── Dobrovolník ── */}
        {volConfig ? (
          <span
            className="flex items-center gap-1 rounded-[100px] font-bold
                       px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
            style={{ background: volConfig.bg, color: volConfig.color }}
          >
            <span>{volConfig.icon}</span>
            <span className="hidden sm:inline">{volConfig.label}</span>
          </span>
        ) : (
          <button
            onClick={handleVolunteerClick}
            className="flex items-center gap-1.5 rounded-[100px] font-bold transition-all hover:opacity-90
                       px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm"
            style={{ background: 'rgba(232,99,74,0.92)', color: 'white',
                     backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          >
            <span>🙋</span>
            <span className="hidden sm:inline">Stát se dobrovolníkem</span>
          </button>
        )}

      </div>

      {showModal && (
        <VolunteerRegisterModal
          onClose={() => setShowModal(false)}
          userEmail={userEmail}
          userName={userName}
          preselectedInstitution={institution}
          onSuccess={() => {
            setVolStatus('pending')
            setShowModal(false)
          }}
        />
      )}
    </>
  )
}
