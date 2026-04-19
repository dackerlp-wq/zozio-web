'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface VolunteerActionsProps {
  volunteerId: string
  currentStatus: string
}

export function VolunteerActions({ volunteerId, currentStatus }: VolunteerActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (status: string) => {
    setLoading(status)
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  if (currentStatus === 'pending') {
    return (
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          loading={loading === 'active'}
          onClick={() => updateStatus('active')}
        >
          ✓ Schválit
        </Button>
        <Button
          variant="sand"
          size="sm"
          loading={loading === 'rejected'}
          onClick={() => updateStatus('rejected')}
        >
          ✗
        </Button>
      </div>
    )
  }

  if (currentStatus === 'active') {
    return (
      <Button
        variant="sand"
        size="sm"
        loading={loading === 'inactive'}
        onClick={() => updateStatus('inactive')}
      >
        Deaktivovat
      </Button>
    )
  }

  if (currentStatus === 'inactive' || currentStatus === 'rejected') {
    return (
      <Button
        variant="primary"
        size="sm"
        loading={loading === 'active'}
        onClick={() => updateStatus('active')}
      >
        Aktivovat
      </Button>
    )
  }

  return null
}
