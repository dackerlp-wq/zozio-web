'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type Role = 'institution_admin' | 'staff' | 'public'

interface SuperadminUserActionsProps {
  userId: string
  currentRole: string
  userEmail: string
}

const ROLE_LABELS: Record<Role, string> = {
  institution_admin: 'Správce instituce',
  staff:             'Pracovník',
  public:            'Veřejný',
}

export function SuperadminUserActions({ userId, currentRole, userEmail }: SuperadminUserActionsProps) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role | ''>('')
  const [loadingRole, setLoadingRole] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleRoleChange = async () => {
    if (!selectedRole) return
    setLoadingRole(true)
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })
      const data = await res.json()
      if (res.ok) {
        showFeedback('success', 'Role aktualizována')
        setSelectedRole('')
        router.refresh()
      } else {
        showFeedback('error', data.error ?? 'Chyba při změně role')
      }
    } catch {
      showFeedback('error', 'Chyba při změně role')
    } finally {
      setLoadingRole(false)
    }
  }

  const handleDelete = async () => {
    setLoadingDelete(true)
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const data = await res.json()
      if (res.ok) {
        showFeedback('success', 'Uživatel smazán')
        setShowDeleteConfirm(false)
        router.refresh()
      } else {
        showFeedback('error', data.error ?? 'Chyba při mazání')
        setShowDeleteConfirm(false)
      }
    } catch {
      showFeedback('error', 'Chyba při mazání')
    } finally {
      setLoadingDelete(false)
    }
  }

  if (showDeleteConfirm) {
    return (
      <div className="flex flex-col gap-2 min-w-[220px]">
        <p className="text-xs font-semibold text-espresso">
          Smazat <span className="text-coral">{userEmail}</span>?
        </p>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={loadingDelete}
            onClick={handleDelete}
            className="text-xs px-3 py-1.5"
          >
            Ano, smazat
          </Button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="text-xs font-semibold text-gray hover:text-espresso transition-colors cursor-pointer bg-transparent border-none"
          >
            Zrušit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {feedback && (
        <span className={`text-xs font-bold px-2 py-1 rounded-pill
          ${feedback.type === 'success' ? 'bg-success-bg text-success' : 'bg-coral-light text-coral'}`}>
          {feedback.message}
        </span>
      )}

      <div className="flex gap-2 items-center">
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value as Role | '')}
          className="text-xs font-semibold text-espresso bg-sand border border-gray-pale rounded-pill px-2.5 py-1.5 cursor-pointer
            focus:outline-none focus:border-gray-light transition-colors"
        >
          <option value="">Změnit roli…</option>
          {(Object.entries(ROLE_LABELS) as [Role, string][])
            .filter(([key]) => key !== currentRole)
            .map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
        </select>

        {selectedRole && (
          <Button
            variant="dark"
            size="sm"
            loading={loadingRole}
            onClick={handleRoleChange}
            className="text-xs px-3 py-1.5"
          >
            Uložit
          </Button>
        )}

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-xs font-semibold text-gray hover:text-coral transition-colors cursor-pointer bg-transparent border-none whitespace-nowrap"
        >
          Smazat
        </button>
      </div>
    </div>
  )
}
