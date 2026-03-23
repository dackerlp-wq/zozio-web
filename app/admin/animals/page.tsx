import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default async function AdminAnimalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('institution_members')
    .select('role, institution:institutions(id, name, type)')
    .eq('user_id', user.id)
    .single()

  const institution = (membership?.institution as unknown) as { id: string; name: string; type: string } | null
  if (!institution) redirect('/auth/register')

  const isShelter = institution.type === 'shelter'

  // Načti zvířata nebo pacienty
  const { data: animals } = isShelter
    ? await supabase
        .from('animals')
        .select('*, species:animal_species(name_cs, icon)')
        .eq('institution_id', institution.id)
        .order('urgent', { ascending: false })
        .order('created_at', { ascending: false })
    : await supabase
        .from('rescue_cases')
        .select('*, species:animal_species(name_cs, icon)')
        .eq('institution_id', institution.id)
        .order('created_at', { ascending: false })

  const items = animals ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-4xl text-espresso">
            {isShelter ? '🐾 Zvířata' : '🦉 Pacienti'}
          </h1>
          <p className="text-gray mt-1 font-semibold">{items.length} záznamů</p>
        </div>
        <Link href="/admin/animals/new">
          <Button variant={isShelter ? 'primary' : 'rescue'}>
            + {isShelter ? 'Přidat zvíře' : 'Nový pacient'}
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-pale">
          <div className="text-5xl mb-4">{isShelter ? '🐾' : '🦉'}</div>
          <h3 className="font-display font-bold text-xl text-espresso mb-2">
            Zatím žádná {isShelter ? 'zvířata' : 'záchranné případy'}
          </h3>
          <p className="text-gray mb-6">Přidej první záznam kliknutím na tlačítko výše.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-pale overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-pale bg-sand/50">
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">
                  {isShelter ? 'Zvíře' : 'Pacient'}
                </th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Druh</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">
                  {isShelter ? 'Stav adopce' : 'Stav léčby'}
                </th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Přijato</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: Record<string, unknown>, i: number) => (
                <tr key={item.id as string} className={`border-b border-gray-pale/50 hover:bg-sand/20 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-pale/10'}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {isShelter && (item.urgent as boolean) && (
                        <span className="text-coral text-sm font-bold">🆘</span>
                      )}
                      <span className="font-display font-bold text-sm text-espresso">
                        {(item.name as string) ?? (item.case_number as string)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray font-semibold">
                    {(item.species as { icon: string; name_cs: string } | null)?.icon}{' '}
                    {(item.species as { icon: string; name_cs: string } | null)?.name_cs ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {isShelter ? (
                      <Badge variant={
                        item.adoption_status === 'available' ? 'available' :
                        item.adoption_status === 'reserved'  ? 'reserved'  :
                        item.adoption_status === 'adopted'   ? 'adopted'   : 'available'
                      } />
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold bg-rescue-bg text-rescue-dark">
                        {item.status as string}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray font-semibold">
                    {new Date((item.intake_date as string) ?? (item.created_at as string)).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/animals/${item.id as string}`}>
                      <Button variant="sand" size="sm">Upravit</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
