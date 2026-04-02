'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Institution {
  id: string
  name: string
  type: string
}

interface Props {
  userId: string
  isSuperadmin: boolean
  membership: { institutionId: string; role: string } | null
  institutions: Institution[]
}

export function UserRoleManager({ userId, isSuperadmin, membership, institutions }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Superadmin toggle
  const toggleSuperadmin = async () => {
    setLoading(true)
    await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ superadmin: !isSuperadmin }),
    })
    router.refresh()
    setLoading(false)
  }

  // Změna role v instituci
  const setMembership = async (institutionId: string, role: 'admin' | 'staff') => {
    setLoading(true)
    await fetch(`/api/users/${userId}/membership`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institutionId, role }),
    })
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  // Odebrání z instituce
  const removeMembership = async () => {
    setLoading(true)
    await fetch(`/api/users/${userId}/membership`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remove: true }),
    })
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Superadmin toggle */}
      <button
        onClick={toggleSuperadmin}
        disabled={loading}
        className={`text-xs font-bold px-2.5 py-1 rounded-pill border transition-colors cursor-pointer disabled:opacity-50 w-fit
          ${isSuperadmin
            ? 'border-coral/30 text-coral hover:bg-coral/10'
            : 'border-amber/30 text-warning hover:bg-amber-light'
          }`}
      >
        {loading ? '...' : isSuperadmin ? '✕ Odebrat superadmin' : '⚡ Superadmin'}
      </button>

      {/* Institution role editor */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          disabled={loading}
          className="text-xs font-bold px-2.5 py-1 rounded-pill border border-gray-pale text-gray hover:bg-sand transition-colors cursor-pointer disabled:opacity-50 w-fit"
        >
          {membership ? `✏️ ${membership.role}` : '+ Přiřadit instituci'}
        </button>
      ) : (
        <div className="border border-gray-pale rounded-lg p-3 bg-sand/50 min-w-[220px]">
          <div className="text-[10px] font-bold text-gray uppercase tracking-wider mb-2">Instituce + role</div>
          <select
            defaultValue={membership?.institutionId ?? ''}
            id={`inst-${userId}`}
            className="w-full text-xs border border-gray-pale rounded-md px-2 py-1.5 bg-white mb-2 font-semibold"
          >
            <option value="" disabled>Vyber instituci…</option>
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.type === 'shelter' ? '🏠' : '🚑'} {inst.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                const sel = (document.getElementById(`inst-${userId}`) as HTMLSelectElement).value
                if (sel) setMembership(sel, 'admin')
              }}
              disabled={loading}
              className="flex-1 text-xs font-bold px-2 py-1.5 rounded-md bg-espresso text-white hover:bg-espresso/80 transition-colors cursor-pointer disabled:opacity-50"
            >
              Admin
            </button>
            <button
              onClick={() => {
                const sel = (document.getElementById(`inst-${userId}`) as HTMLSelectElement).value
                if (sel) setMembership(sel, 'staff')
              }}
              disabled={loading}
              className="flex-1 text-xs font-bold px-2 py-1.5 rounded-md bg-gray-pale text-espresso hover:bg-gray-light transition-colors cursor-pointer disabled:opacity-50"
            >
              Staff
            </button>
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {membership && (
              <button
                onClick={removeMembership}
                disabled={loading}
                className="flex-1 text-xs font-bold px-2 py-1.5 rounded-md border border-coral/30 text-coral hover:bg-coral/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                Odebrat
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="flex-1 text-xs px-2 py-1.5 rounded-md text-gray hover:bg-gray-pale transition-colors cursor-pointer"
            >
              Zrušit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
