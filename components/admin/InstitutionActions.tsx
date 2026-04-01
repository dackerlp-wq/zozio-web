'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface InstitutionActionsProps {
  institutionId: string
  currentStatus: string
  institutionName: string
}

export function InstitutionActions({ institutionId, currentStatus, institutionName }: InstitutionActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (status: 'approved' | 'rejected') => {
    setLoading(status)
    try {
      const res = await fetch(`/api/institutions/${institutionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  if (currentStatus === 'approved') {
    return (
      <button
        onClick={() => updateStatus('rejected')}
        disabled={loading !== null}
        className="text-xs text-gray hover:text-coral transition-colors font-semibold cursor-pointer bg-transparent border-none"
      >
        Zrušit schválení
      </button>
    )
  }

  if (currentStatus === 'rejected') {
    return (
      <Button variant="sand" size="sm" loading={loading === 'approved'} onClick={() => updateStatus('approved')}>
        Schválit
      </Button>
    )
  }

  // pending
  return (
    <div className="flex gap-2">
      <Button
        variant="primary"
        size="sm"
        loading={loading === 'approved'}
        onClick={() => updateStatus('approved')}
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
