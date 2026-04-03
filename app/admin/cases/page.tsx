import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>
}

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  intake:         { bg: '#FDEAE6', color: '#993C1D', label: 'Příjem' },
  treatment:      { bg: '#FEF3CD', color: '#7A5200', label: 'Léčba' },
  rehabilitation: { bg: '#E1F5EE', color: '#0F6E56', label: 'Rehabilitace' },
  released:       { bg: '#E6F7ED', color: '#2A7D4F', label: 'Propuštěno' },
  deceased:       { bg: '#F0EDE8', color: '#8B6550', label: 'Uhynulo' },
}

const filterTabs = [
  { value: '', label: 'Všechny' },
  { value: 'intake', label: 'Příjem' },
  { value: 'treatment', label: 'Léčba' },
  { value: 'rehabilitation', label: 'Rehabilitace' },
  { value: 'released', label: 'Propuštění' },
]

export default async function CasesPage({ searchParams }: PageProps) {
  const { status: filterStatus } = await searchParams

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
    .select('id, name, type')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  if (institution.type === 'shelter') redirect('/admin/dashboard')

  let query = service
    .from('rescue_cases')
    .select('id, name, case_number, status, cause_of_injury, intake_date, species:animal_species(name_cs, icon)', { count: 'exact' })
    .eq('institution_id', institution.id)
    .order('intake_date', { ascending: false })
    .limit(20)

  if (filterStatus) {
    query = query.eq('status', filterStatus)
  }

  const { data: cases, count } = await query
  const caseList = (cases ?? []) as any[]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso">Záznamy léčby</h1>
          {count !== null && count !== undefined && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5F0EC] text-[#8B6550]">
              {count}
            </span>
          )}
        </div>
        <Link
          href="/admin/animals/new"
          className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm text-white no-underline"
          style={{ backgroundColor: '#2E9E8F' }}
        >
          + Přijmout pacienta
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filterTabs.map(tab => {
          const isActive = (filterStatus ?? '') === tab.value
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/cases?status=${tab.value}` : '/admin/cases'}
              className="no-underline"
            >
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold transition-colors"
                style={{
                  backgroundColor: isActive ? '#2E9E8F' : '#F5F0EC',
                  color: isActive ? '#fff' : '#8B6550',
                }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Empty state */}
      {caseList.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#F0EDE8] p-10 text-center">
          <div className="text-4xl mb-3">🦉</div>
          <p className="text-[#8B6550] font-semibold mb-4">Zatím žádní pacienti. Přijměte prvního!</p>
          <Link
            href="/admin/animals/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm text-white no-underline"
            style={{ backgroundColor: '#2E9E8F' }}
          >
            + Přijmout pacienta
          </Link>
        </div>
      )}

      {/* Desktop table */}
      {caseList.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-[#F0EDE8] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EDE8]">
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8B6550] uppercase tracking-wider">Pacient</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8B6550] uppercase tracking-wider">Příčina</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8B6550] uppercase tracking-wider">Stav</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8B6550] uppercase tracking-wider">Datum příjmu</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#8B6550] uppercase tracking-wider">Akce</th>
                </tr>
              </thead>
              <tbody>
                {caseList.map((c: any) => {
                  const badge = statusBadge[c.status] ?? { bg: '#F5F0EC', color: '#8B6550', label: c.status }
                  const species = c.species as any
                  return (
                    <tr key={c.id} className="border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: '#F5F0EC' }}
                          >
                            {species?.icon ?? '🦉'}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#2C1810]">{c.name ?? c.case_number}</div>
                            {c.name && (
                              <div className="text-xs text-[#8B6550]">{c.case_number}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#8B6550]">{c.cause_of_injury ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#8B6550]">
                        {c.intake_date ? new Date(c.intake_date).toLocaleDateString('cs-CZ') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/animals/${c.id}`}
                          className="text-sm font-bold text-[#2E9E8F] no-underline hover:underline"
                        >
                          Upravit
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {caseList.map((c: any) => {
              const badge = statusBadge[c.status] ?? { bg: '#F5F0EC', color: '#8B6550', label: c.status }
              const species = c.species as any
              return (
                <Link key={c.id} href={`/admin/animals/${c.id}`} className="no-underline block">
                  <div className="bg-white rounded-2xl border border-[#F0EDE8] px-4 py-3.5 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: '#F5F0EC' }}
                    >
                      {species?.icon ?? '🦉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#2C1810] truncate">{c.name ?? c.case_number}</div>
                      <div className="text-xs text-[#8B6550]">
                        {c.intake_date ? new Date(c.intake_date).toLocaleDateString('cs-CZ') : '—'}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
