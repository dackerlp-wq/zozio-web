import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { CoverageForm } from '@/components/admin/CoverageForm'
import Link from 'next/link'

export default async function CoveragePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('role, institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, type, city, lat, lng, coverage_cities')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  const isShelter    = institution.type === 'shelter'
  const hasCoords    = institution.lat && institution.lng
  const coverageCities: string[] = (institution as any).coverage_cities ?? []

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">
          🗺️ Dosah instituce
        </h1>
        <p className="text-gray mt-1 font-semibold text-sm">{institution.name}</p>
      </div>

      {/* Info box */}
      <div className="mb-6 p-4 rounded-lg border"
        style={{ background: isShelter ? '#FAECE7' : '#E1F5EE', borderColor: isShelter ? 'rgba(232,99,74,0.2)' : 'rgba(46,158,143,0.2)' }}>
        <p className="text-sm font-semibold" style={{ color: isShelter ? '#993C1D' : '#0F6E56' }}>
          📍 Co je dosah instituce?
        </p>
        <p className="text-sm mt-1" style={{ color: isShelter ? '#6B3020' : '#0A4A3E' }}>
          Dosah jsou města a obce, odkud přijímáš zvířata nebo kam zasahuješ.
          Tato informace se zobrazuje na <strong>veřejné mapě institucí</strong> — pomáhá lidem najít nejbližší pomoc pro zvíře.
        </p>
      </div>

      {/* Upozornění bez koordinát */}
      {!hasCoords && (
        <div className="mb-6 p-4 rounded-lg border border-[#F5D8A0] bg-[#FFFBEF]">
          <p className="text-sm font-semibold" style={{ color: '#7A4F00' }}>
            ⚠️ Instituce nemá nastavenou polohu
          </p>
          <p className="text-sm mt-1" style={{ color: '#7A4F00' }}>
            Bez GPS souřadnic se instituce nezobrazí na mapě. Nastav polohu v{' '}
            <Link href="/admin/settings" className="underline font-bold" style={{ color: '#7A4F00' }}>
              Nastavení instituce
            </Link>.
          </p>
        </div>
      )}

      <CoverageForm
        institutionName={institution.name}
        initialCities={coverageCities}
      />

      {/* Odkaz na veřejnou mapu */}
      <div className="mt-8 pt-6 border-t border-[#F0EDE8]">
        <Link href="/map" target="_blank"
          className="inline-flex items-center gap-2 text-sm font-bold no-underline hover:opacity-80"
          style={{ color: '#E8634A' }}>
          🗺️ Zobrazit veřejnou mapu →
        </Link>
      </div>
    </div>
  )
}
