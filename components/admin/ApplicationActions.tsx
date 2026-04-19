'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface ApplicationActionsProps {
  applicationId: string
  currentStatus: string
  applicantEmail: string
  applicantName: string
  institutionId?: string
  confirmedMeetingAt?: string
}

const statusLabel: Record<string, string> = {
  pending:           '⏳ Nová',
  reviewing:         '🔍 Posuzuje se',
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

const ACTIVE_STATUSES = ['pending', 'reviewing', 'meeting_scheduled']

export function ApplicationActions({
  applicationId,
  currentStatus,
  applicantEmail,
  applicantName,
  institutionId,
  confirmedMeetingAt,
}: ApplicationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [institutionNote, setInstitutionNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Meeting date picker modal
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingDates, setMeetingDates] = useState<string[]>(['', '', ''])
  const [overlapWarnings, setOverlapWarnings] = useState<string[]>([])

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

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

  const checkOverlaps = async (dates: string[]) => {
    if (!institutionId) return
    try {
      const res = await fetch(`/api/institutions/${institutionId}/meetings`)
      if (!res.ok) return
      const { meetings } = await res.json() as { meetings: { meeting_at: string; applicant_name: string; animal: { name: string } | null }[] }
      const warnings: string[] = []
      const WINDOW_MS = 2 * 60 * 60 * 1000 // 2 hodiny buffer

      for (const proposed of dates) {
        if (!proposed) continue
        const propTime = new Date(proposed).getTime()
        for (const m of meetings) {
          if (!m.meeting_at) continue
          const diff = Math.abs(new Date(m.meeting_at).getTime() - propTime)
          if (diff < WINDOW_MS) {
            const formattedDate = new Date(m.meeting_at).toLocaleString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
            warnings.push(`${new Date(proposed).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })} se kryje s ${m.applicant_name} / ${m.animal?.name ?? '?'} (${formattedDate})`)
          }
        }
      }
      setOverlapWarnings(warnings)
    } catch { /* ignoruj */ }
  }

  const scheduleMeeting = async () => {
    const validDates = meetingDates.filter(Boolean)
    if (!validDates.length) {
      setError('Zadejte alespoň jeden termín')
      return
    }
    await updateStatus('meeting_scheduled', { meeting_options: validDates })
    setShowMeetingModal(false)
    setOverlapWarnings([])
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Zadejte důvod zamítnutí')
      return
    }
    await updateStatus('rejected', { institution_note: rejectionReason.trim() })
    setShowRejectModal(false)
    setRejectionReason('')
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
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => updateStatus('reviewing')}
            >
              🔍 Zahájit posuzování
            </Button>
          )}

          {currentStatus === 'reviewing' && (
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => setShowMeetingModal(true)}
            >
              📅 Naplánovat schůzku
            </Button>
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

          {isClosed && (
            <div className="text-center text-sm text-gray py-2">
              Žádost je uzavřena.
            </div>
          )}

          {/* Zamítnout — pro všechny aktivní stavy */}
          {ACTIVE_STATUSES.includes(currentStatus) && (
            <Button
              variant="sand"
              size="sm"
              className="w-full justify-center"
              loading={loading}
              onClick={() => { setError(null); setShowRejectModal(true) }}
            >
              ✗ Zamítnout žádost
            </Button>
          )}

          {/* Storno — pro všechny aktivní stavy */}
          {ACTIVE_STATUSES.includes(currentStatus) && (
            <Button
              variant="sand"
              size="sm"
              className="w-full justify-center mt-1 opacity-60 hover:opacity-100"
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
                      checkOverlaps(next)
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

            {overlapWarnings.length > 0 && (
              <div className="bg-[#FFF8E6] border border-[#F0A500]/40 rounded-sm px-3 py-2 mb-3">
                <div className="text-[11px] font-bold text-[#854F0B] mb-1">⚠️ Možné překryvy s jinými schůzkami:</div>
                {overlapWarnings.map((w, i) => (
                  <div key={i} className="text-[11px] text-[#854F0B]">• {w}</div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="sand" size="sm" className="flex-1 justify-center" onClick={() => { setShowMeetingModal(false); setOverlapWarnings([]) }}>
                Zrušit
              </Button>
              <Button variant="primary" size="sm" className="flex-1 justify-center" loading={loading} onClick={scheduleMeeting}>
                📅 Odeslat termíny
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject modal ── */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,15,10,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowRejectModal(false) }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-display font-extrabold text-lg text-espresso mb-1">Zamítnout žádost</h3>
            <p className="text-xs text-gray mb-4">
              Napište žadateli důvod zamítnutí — obdrží ho e-mailem.
            </p>

            <div className="mb-4">
              <label className="text-xs font-bold text-gray uppercase tracking-wider block mb-1.5">
                Důvod zamítnutí *
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => { setRejectionReason(e.target.value); setError(null) }}
                placeholder="Např. Hledáme rodinu s větší zahradou, protože pes vyžaduje volný pohyb..."
                rows={4}
                className="w-full px-3 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors resize-none"
                autoFocus
              />
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
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); setError(null) }}
              >
                Zpět
              </Button>
              <Button
                variant="sand"
                size="sm"
                className="flex-1 justify-center"
                loading={loading}
                onClick={handleReject}
                style={{ background: '#993C1D', color: 'white' }}
              >
                ✗ Zamítnout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
