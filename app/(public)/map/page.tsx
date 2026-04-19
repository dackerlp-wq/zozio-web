import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/service'
import type { MapInstitution } from '@/components/public/InstitutionsMapClient'
import { MapWrapper } from '@/components/public/MapWrapper'

export const metadata: Metadata = {
  title: 'Mapa útulků a záchranných stanic | Zozio',
  description: 'Interaktivní mapa útulků a záchranných stanic v ČR a SR s jejich dosahem — odkud přijímají zvířata.',
}

export const revalidate = 3600

export default async function MapPage() {
  const institutions = await getInstitutions()

  const total    = institutions.length
  const shelters = institutions.filter(i => i.type === 'shelter').length
  const withArea = institutions.filter(i => i.coverage_cities && i.coverage_cities.length > 0).length

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-8" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="py-6 md:py-8">
          <h1 className="font-display font-extrabold text-[#1A0F0A] mb-1"
            style={{ fontSize: 'clamp(22px, 3.5vw, 32px)' }}>
            🗺️ Mapa útulků
          </h1>
          <p className="text-sm" style={{ color: '#8B6550' }}>
            Interaktivní přehled institucí v ČR a SR · klikni na instituci pro detail a dosah
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-4">
            {[
              { label: 'Celkem útulků', value: total, color: '#1A0F0A' },
              { label: 'Útulky',        value: shelters, color: '#E8634A' },
              { label: 'S definovaným dosahem', value: withArea, color: '#8B6550' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#F0EDE8]">
                <span className="font-extrabold text-lg" style={{ color }}>{value}</span>
                <span className="text-xs" style={{ color: '#8B6550' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <MapWrapper institutions={institutions} />

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs" style={{ color: '#8B6550' }}>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#E8634A] inline-block" />
            Útulek
          </div>
          <div className="hidden items-center gap-1.5">
          </div>
          <span>· Klikni na značku pro detail a seznam měst v dosahu</span>
        </div>
      </div>
    </main>
  )
}

async function getInstitutions(): Promise<MapInstitution[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('institutions')
    .select('id, name, slug, type, city, lat, lng, logo_url, coverage_cities')
    .eq('approval_status', 'approved')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('name')
  return (data ?? []) as MapInstitution[]
}
