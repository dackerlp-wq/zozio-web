import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { CoverageForm } from '@/components/admin/CoverageForm'
import Link from 'next/link'

export const metadata = { title: 'Dosah na mapě — Nastavení — Zozio Admin' }

export default async function SettingsCoveragePage() {
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

  const isShelter = institution.type === 'shelter'
  const hasCoords = institution.lat && institution.lng
  const coverageCities: string[] = (institution as any).coverage_cities ?? []

  return (
    <div>
      <nav className="flex items-center gap-2 text-sm text-[#A09890] mb-5 font-semibold">
        <span>Nastavení</span>
        <span>·</span>
        <span className="text-[#2C1810]">Dosah na mapě</span>
      </nav>
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-[#2C1810]">🗺️ Dosah na mapě</h1>
        <p className="text-sm text-[#8B6550] mt-1 font-semibold">{institution.name}</p>
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
            <Link href="/admin/settings/info" className="underline font-bold" style={{ color: '#7A4F00' }}>
              Základní informace
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
