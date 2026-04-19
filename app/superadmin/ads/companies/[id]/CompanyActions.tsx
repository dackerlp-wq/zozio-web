'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CompanyActionsProps {
  companyId: string
  approved: boolean
}

export function CompanyActions({ companyId, approved }: CompanyActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    await fetch(`/api/superadmin/companies/${companyId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: !approved }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-60"
      style={approved
        ? { background: '#F0EDE8', color: '#6B4030' }
        : { background: '#EAF3DE', color: '#3B6D11' }}>
      {loading ? '...' : approved ? 'Odebrat schválení' : 'Schválit firmu'}
    </button>
  )
}
