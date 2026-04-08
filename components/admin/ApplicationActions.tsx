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
  cancelled:         '🚫 Stornováno',
}

const statusColor: Record<string, string> = {
  pending:           'bg-amber-light text-warning',
  reviewing:         'bg-rescue-bg text-rescue-dark',
  approved:          'bg-success-bg text-success',
  rejected:          'bg-gray-pale text-gray',
  meeting_scheduled: 'bg-coral-light text-coral-dark',
  adopted:           'bg-success-bg text-success',
  cancelled:         'bg-gray-pale text-gray',
}

const ACTIVE_STATUSES = ['pending', 'reviewing', 'approved', 'meeting_scheduled']

export function ApplicationActions({
  applicationId,
  currentStatus,
  applicantEmail,
  applicantName,
}: ApplicationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [institutionNote, setInstitutionNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Meeting date picker state
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingDates, setMeetingDates] = useState<string[]>(['', '', ''])

  const updateStatus = async (status: string, extraBody?: object) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          staff_notes:      notes || undefined,
          institution_note: institutionNote || undefined,
          ...extraBody,
        }),
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

  const scheduleMeeting = async () => {
    const validDates = meetingDates.filter(Boolean)
    if (!validDates.length) {
      setError('Zadejte alespoň jeden termín')
      return
    }
    await updateStatus('meeting_scheduled', { meeting_options: validDates })
    setShowMeetingModal(false)
  }

  const isClosed = ['rejected', 'adopted', 'cancelled'].includes(currentStatus)

  return (
    <>
      <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
        <h3 className="font-display font-extrabold text-lg text-espresso mb-4">Správa žádosti</h3>

        {/* Aktuální stav */}
        <div className="mb-4">
          <div className="text-xs font-bold text-gray uppercase tracking-wider mb-1.5">Aktuální stav</div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-pill text-sm font-bold ${statusColor[currentStatus] ?? 'bg-gray-pale text-gray'}`}>
            {statusLabel[currentStatus] ?? currentStatus}
          </span>
        </div>

        {/* Zpráva pro žadatele (půjde do emailu) */}
        {!isClosed && (
          <div className="mb-4">
            <label className="text-xs font-bold text-gray uppercase tracking-wider block mb-1.5">
              Zpráva pro žadatele <span className="font-normal normal-case">(zobrazí se v emailu)</span>
            </label>
            <textarea
              value={institutionNote}
              onChange={e => setInstitutionNote(e.target.value)}
              placeholder="Napište žadateli krátkou zprávu..."
              rows={2}
              className="w-full px-3 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors resize-none"
            />
          </div>
        )}

        {/* Interní poznámka */}
        {!isClosed && (
          <div className="mb-4">
            <label className="text-xs font-bold text-gray uppercase tracking-wider block mb-1.5">
              Interní poznámka <span className="font-normal normal-case">(jen pro vás)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Poznámka pro tým..."
              rows={2}
              className="w-full px-3 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors resize-none"
            />
          </div>
        )}

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
                onClick={() => setShowMeetingModal(true)}
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
                variant="primary"
                size="sm"
                className="w-full justify-center"
                loading={loading}
                onClick={() => setShowMeetingModal(true)}
              >
                📅 Změnit termín schůzky
              </Button>
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

          {isClosed && (
            <div className="text-center text-sm text-gray py-2">
              Žádost je uzavřena.
            </div>
          )}

          {/* Storno — pro všechny aktivní stavy */}
          {ACTIVE_STATUSES.includes(currentStatus) && (
            <Button
              variant="sand"
              size="sm"
              className="w-full justify-center mt-1"
              loading={loading}
              onClick={() => {
                if (confirm('Opravdu chcete zrušit tuto žádost o adopci?')) {
                  updateStatus('cancelled')
                }
              }}
            >
              🚫 Storno adopce
            </Button>
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

      {/* ── Meeting date picker modal ── */}
      {showMeetingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,15,10,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowMeetingModal(false) }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-display font-extrabold text-lg text-espresso mb-1">Naplánovat schůzku</h3>
            <p className="text-xs text-gray mb-4">Zadejte až 3 termíny — žadatel si vybere, který mu vyhovuje.</p>

            <div className="space-y-3 mb-4">
              {meetingDates.map((date, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-brown uppercase tracking-wider">
                    Termín {i + 1}{i === 0 ? ' *' : ' (volitelný)'}
                  </label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={e => {
                      const next = [...meetingDates]
                      next[i] = e.target.value
                      setMeetingDates(next)
                    }}
                    className="px-3 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors"
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-coral-light text-coral-dark text-xs font-semibold px-3 py-2 rounded-sm mb-3">
                ⚠️ {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="sand"
                size="sm"
                className="flex-1 justify-center"
                onClick={() => setShowMeetingModal(false)}
              >
                Zrušit
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 justify-center"
                loading={loading}
                onClick={scheduleMeeting}
              >
                📅 Odeslat termíny
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
