'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface MeetingSchedulerProps {
  applicationId: string
  animalName: string
  applicantName: string
  applicantEmail: string
  currentMeetingAt?: string | null
}

function toDatetimeLocalValue(iso: string): string {
  // Convert ISO string to "YYYY-MM-DDTHH:mm" format for datetime-local input
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function MeetingScheduler({
  applicationId,
  animalName,
  applicantName,
  applicantEmail,
  currentMeetingAt,
}: MeetingSchedulerProps) {
  const router = useRouter()
  const [meetingAt, setMeetingAt] = useState<string>(
    currentMeetingAt ? toDatetimeLocalValue(currentMeetingAt) : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    if (!meetingAt) {
      setError('Vyberte prosím datum a čas schůzky.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'meeting_scheduled',
          meeting_at: new Date(meetingAt).toISOString(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Chyba při ukládání')
      }
      setSuccess(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 md:p-5 border border-border shadow-sm">
      <h3 className="font-display font-extrabold text-lg text-espresso mb-1">
        📅 Naplánovat schůzku
      </h3>
      <p className="text-xs text-gray font-semibold mb-4">
        {applicantName} &middot; {applicantEmail} &middot; {animalName}
      </p>

      {/* Current meeting time display */}
      {currentMeetingAt && (
        <div className="bg-coral-light rounded-md px-3 py-2.5 mb-4">
          <div className="text-xs font-bold text-coral-dark uppercase tracking-wider mb-0.5">
            Naplánovaná schůzka
          </div>
          <div className="text-sm font-bold text-espresso">
            {new Date(currentMeetingAt).toLocaleDateString('cs-CZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor={`meeting-at-${applicationId}`}
          className="text-xs font-bold text-gray uppercase tracking-wider block mb-1.5"
        >
          {currentMeetingAt ? 'Změnit datum a čas' : 'Datum a čas schůzky'}
        </label>
        <input
          id={`meeting-at-${applicationId}`}
          type="datetime-local"
          value={meetingAt}
          onChange={e => {
            setMeetingAt(e.target.value)
            setSuccess(false)
            setError(null)
          }}
          className="w-full px-3 py-2.5 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors bg-white"
        />
      </div>

      {error && (
        <div className="bg-coral-light text-coral-dark text-xs font-semibold px-3 py-2 rounded-sm mb-3">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-success-bg text-success text-xs font-semibold px-3 py-2 rounded-sm mb-3">
          ✓ Schůzka byla uložena a žadatel bude informován.
        </div>
      )}

      <Button
        variant="primary"
        size="sm"
        className="w-full justify-center"
        loading={loading}
        onClick={handleSave}
      >
        📅 Uložit datum schůzky
      </Button>
    </div>
  )
}
