import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AdminAnimalSearch } from '@/components/admin/AdminAnimalSearch'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function AdminAnimalsPage({ searchParams }: PageProps) {
  const { q, status: filterStatus } = await searchParams

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

  const isShelter = institution.type === 'shelter'

  // Načti s filtry
  let animalsQuery = isShelter
    ? service.from('animals').select('id, name, urgent, adoption_status, health_status, in_quarantine, in_foster, species:animal_species(name_cs,icon), intake_date, created_at').eq('institution_id', institution.id)
    : service.from('rescue_cases').select('id, name, case_number, status, health_status, species:animal_species(name_cs,icon), intake_date, created_at').eq('institution_id', institution.id)

  // Filtr stavu
  if (filterStatus) {
    animalsQuery = isShelter
      ? (animalsQuery as any).eq('adoption_status', filterStatus)
      : (animalsQuery as any).eq('status', filterStatus)
  }

  // Vyhledávání
  if (q) {
    animalsQuery = isShelter
      ? (animalsQuery as any).ilike('name', `%${q}%`)
      : (animalsQuery as any).or(`name.ilike.%${q}%,case_number.ilike.%${q}%`)
  }

  // Řazení
  const { data: animals } = isShelter
    ? await (animalsQuery as any).order('urgent', { ascending: false }).order('created_at', { ascending: false })
    : await (animalsQuery as any).order('created_at', { ascending: false })

  const items = (animals ?? []) as any[]

  // Statusy pro filter
  const shelterStatuses = [
    { value: '', label: 'Všechny' },
    { value: 'available',        label: 'K adopci' },
    { value: 'reserved',         label: 'Rezervováno' },
    { value: 'foster',           label: 'Ve foster' },
    { value: 'adopted',          label: 'Adoptováno' },
    { value: 'not_for_adoption', label: 'Není k adopci' },
  ]
  const rescueStatuses = [
    { value: '',               label: 'Všechny' },
    { value: 'intake',         label: 'Příjem' },
    { value: 'treatment',      label: 'Léčba' },
    { value: 'rehabilitation', label: 'Rehabilitace' },
    { value: 'released',       label: 'Propuštěn' },
    { value: 'transferred',    label: 'Přemístěn' },
    { value: 'deceased',       label: 'Uhynul' },
  ]
  const statuses = isShelter ? shelterStatuses : rescueStatuses

  return (
    <div>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">
            {isShelter ? '🐾 Zvířata' : '🦉 Pacienti'}
          </h1>
          <p className="text-gray mt-1 font-semibold text-sm">{items.length} záznamů</p>
        </div>
        <Link href="/admin/animals/new">
          <Button variant={isShelter ? 'primary' : 'rescue'} size="sm">
            + {isShelter ? 'Přidat' : 'Nový pacient'}
          </Button>
        </Link>
      </div>

      {/* Search + filtry stavu */}
      <AdminAnimalSearch statuses={statuses} currentStatus={filterStatus ?? ''} currentQ={q ?? ''} />

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-pale">
          <div className="text-5xl mb-4">{isShelter ? '🐾' : '🦉'}</div>
          <h3 className="font-display font-bold text-xl text-espresso mb-2">
            {q || filterStatus ? 'Žádné výsledky' : 'Zatím žádné záznamy'}
          </h3>
          {!q && !filterStatus && (
            <Link href="/admin/animals/new" className="mt-4 inline-block">
              <Button variant="primary">+ Přidat první záznam</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobilní karty */}
          <div className="md:hidden space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-pale shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isShelter && item.urgent       && <span>🆘</span>}
                    {item.in_quarantine              && <span title="Karanténa">🚧</span>}
                    {isShelter && item.in_foster     && <span title="Foster">🏠</span>}
                    <span className="font-display font-bold text-base text-espresso">
                      {item.name ?? item.case_number}
                    </span>
                  </div>
                  <Badge variant={isShelter ? item.adoption_status : item.status} size="sm" />
                </div>
                <div className="text-xs text-gray font-semibold mb-3">
                  {item.species?.icon} {item.species?.name_cs ?? '—'}
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/animals/${item.id}`} className="flex-1">
                    <Button variant="sand" size="sm" className="w-full justify-center">Upravit</Button>
                  </Link>
                  <a href={`/admin/animals/${item.id}/qr`} target="_blank"
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-espresso text-white font-bold text-xs rounded-sm hover:bg-brown transition-colors no-underline"
                    title="QR karta">
                    ▣
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop tabulka */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-pale overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-pale bg-sand/50">
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">{isShelter ? 'Zvíře' : 'Pacient'}</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Druh</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Stav</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Příznaky</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Přijato</th>
                  <th className="px-5 py-3 text-right font-body text-xs font-bold text-gray uppercase tracking-wider">Akce</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, i: number) => (
                  <tr key={item.id} className={`border-b border-gray-pale/50 hover:bg-sand/20 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-pale/10'}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {isShelter && item.urgent   && <span title="Urgentní">🆘</span>}
                        {item.in_quarantine          && <span title="V karanténě">🚧</span>}
                        {isShelter && item.in_foster && <span title="Ve foster péči">🏠</span>}
                        <span className="font-display font-bold text-sm text-espresso">
                          {item.name ?? item.case_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray font-semibold">
                      {item.species?.icon} {item.species?.name_cs ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={isShelter ? item.adoption_status : item.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5">
                      {item.health_status && item.health_status !== 'healthy' && (
                        <Badge variant={item.health_status} size="sm" />
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray font-semibold">
                      {new Date(item.intake_date ?? item.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/admin/animals/${item.id}/qr`} target="_blank"
                          className="inline-flex items-center justify-center w-8 h-8 bg-espresso text-white text-sm rounded-sm hover:bg-brown transition-colors no-underline"
                          title="QR karta">
                          ▣
                        </a>
                        <Link href={`/admin/animals/${item.id}`}>
                          <Button variant="sand" size="sm">Upravit</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
