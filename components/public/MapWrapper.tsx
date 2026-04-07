'use client'
import dynamic from 'next/dynamic'
import type { MapInstitution } from './InstitutionsMapClient'

const InstitutionsMapClient = dynamic(
  () => import('./InstitutionsMapClient').then(m => m.InstitutionsMapClient),
  { ssr: false, loading: () => <MapSkeleton /> }
)

function MapSkeleton() {
  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] rounded-lg overflow-hidden border border-[#F0EDE8] bg-[#F5F0EA] animate-pulse">
      <div className="w-80 bg-white border-r border-[#F0EDE8]" />
      <div className="flex-1" />
    </div>
  )
}

export function MapWrapper({ institutions }: { institutions: MapInstitution[] }) {
  return <InstitutionsMapClient institutions={institutions} />
}
