'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface ApplicationActionsProps {
  applicationId: string
  currentStatus: string
  applicantEmail: string
  applicantName: string
}

const statusLabel: Record<string, string> = {
  pending:           '⏳ Nová',
  reviewing:         '🔍 Prochází',
  approved:          '✓ Schválena',
  rejected:          '✗ Zamítnuta',
  meeting_scheduled: '📅 Schůzka naplánována',
  adopted:           '🏠 Adoptováno',
}

const statusColor: Record<string, string> = {
  pending:           'bg-amber-light text-warning',
  reviewing:         'bg-rescue-bg text-rescue-dark',
  approved:          'bg-success-bg text-success',
  rejected:          'bg-gray-pale text-gray',
  meeting_scheduled: 'bg-coral-light text-coral-dark',
  adopted:           'bg-success-bg text-success',
}

export function ApplicationActions({
  applicationId,
  currentStatus,
  applicantEmail,
  applicantName,
}: ApplicationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const updateStatus = async (status: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, staff_notes: notes || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Chyba')
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
      <h3 className="font-display font-extrabold text-lg text-espresso mb-4">Správa žádosti</h3>

      {/* Aktuální stav */}
      <div className="mb-4">
        <div className="text-xs font-bold text-gray uppercase tracking-wider mb-1.5">Aktuální stav</div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-pill text-sm font-bold ${statusColor[currentStatus] ?? 'bg-gray-pale text-gray'}`}>
          {statusLabel[currentStatus] ?? currentStatus}
        </span>
      </div>

      {/* Interní poznámka */}
      <div className="mb-4">
        <label className="text-xs font-bold text-gray uppercase tracking-wider block mb-1.5">
          Interní poznámka (volitelná)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Poznámka pro tým..."
          rows={3}
          className="w-full px-3 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="bg-coral-light text-coral-dark text-xs font-semibold px-3 py-2 rounded-sm mb-3">
          ⚠️ {error}
        </div>
      )}

      {/* Akce */}
      <div className="space-y-2">
        {currentStatus === 'pending' && (
          <>
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => updateStatus('reviewing')}
            >
              🔍 Zahájit posuzování
            </Button>
            <Button
              variant="sand"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => updateStatus('rejected')}
            >
              ✗ Zamítnout
            </Button>
          </>
        )}

        {currentStatus === 'reviewing' && (
          <>
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => updateStatus('meeting_scheduled')}
            >
              📅 Naplánovat schůzku
            </Button>
            <Button
              variant="rescue"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => updateStatus('approved')}
            >
              ✓ Schválit žádost
            </Button>
            <Button
              variant="sand"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => updateStatus('rejected')}
            >
              ✗ Zamítnout
            </Button>
          </>
        )}

        {currentStatus === 'meeting_scheduled' && (
          <>
            <Button
              variant="rescue"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => updateStatus('approved')}
            >
              ✓ Schválit adopci
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => updateStatus('adopted')}
            >
              🏠 Označit jako adoptováno
            </Button>
          </>
        )}

        {currentStatus === 'approved' && (
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center"
            loading={loading}
            onClick={() => updateStatus('adopted')}
          >
            🏠 Označit jako adoptováno
          </Button>
        )}

        {(currentStatus === 'rejected' || currentStatus === 'adopted') && (
          <div className="text-center text-sm text-gray py-2">
            Žádost je uzavřena.
          </div>
        )}
      </div>

      {/* Kontakt na žadatele */}
      <div className="mt-4 pt-4 border-t border-gray-pale">
        <div className="text-xs font-bold text-gray uppercase tracking-wider mb-2">Kontaktovat žadatele</div>
        <a
          href={`mailto:${applicantEmail}?subject=Vaše žádost o adopci`}
          className="flex items-center gap-2 text-sm font-semibold text-coral hover:text-coral-dark transition-colors no-underline"
        >
          ✉️ {applicantEmail}
        </a>
      </div>
    </div>
  )
}
