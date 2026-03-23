import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const statusLabel: Record<string, string> = {
  pending:           '⏳ Nová',
  reviewing:         '🔍 Prochází',
  approved:          '✓ Schválena',
  rejected:          '✗ Zamítnuta',
  meeting_scheduled: '📅 Schůzka',
  adopted:           '🏠 Adoptováno',
}

const statusColor: Record<string, string> = {
  pending:           'bg-amber-light text-warning',
  reviewing:         'bg-rescue-bg text-rescue-dark',
  approved:          'bg-success-bg text-success',
  rejected:          'bg-gray-pale text-gray',
  meeting_scheduled: 'bg-coral-light text-coral-dark',
  adopted:           'bg-success-bg text-success',
}

export default async function AdminApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('institution_members')
    .select('institution:institutions(id, name, type)')
    .eq('user_id', user.id)
    .single()

  const institution = membership?.institution as { id: string; name: string; type: string } | null
  if (!institution || institution.type !== 'shelter') redirect('/admin/dashboard')

  const { data: applications } = await supabase
    .from('adoption_applications')
    .select(`
      *,
      animal:animals(name, species:animal_species(name_cs, icon))
    `)
    .eq('institution_id', institution.id)
    .order('created_at', { ascending: false })

  const items = applications ?? []
  const pending = items.filter(a => a.status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-4xl text-espresso">
            📋 Žádosti o adopci
          </h1>
          <p className="text-gray mt-1 font-semibold">
            {items.length} celkem
            {pending > 0 && <span className="ml-2 text-coral font-bold">· {pending} nových</span>}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-pale">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-display font-bold text-xl text-espresso mb-2">
            Zatím žádné žádosti
          </h3>
          <p className="text-gray">Žádosti se zobrazí zde, jakmile je někdo podá přes web.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-pale overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-pale bg-sand/50">
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Žadatel</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Zvíře</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Stav</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Podáno</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((app, i) => (
                <tr key={app.id} className={`border-b border-gray-pale/50 hover:bg-sand/20 transition-colors ${app.status === 'pending' ? 'bg-amber-light/20' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="font-display font-bold text-sm text-espresso">{app.applicant_name}</div>
                    <div className="text-xs text-gray">{app.applicant_email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray font-semibold">
                    {(app.animal as { name: string; species: { icon: string } | null } | null)?.animal?.species?.icon}{' '}
                    {(app.animal as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold ${statusColor[app.status] ?? 'bg-gray-pale text-gray'}`}>
                      {statusLabel[app.status] ?? app.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray font-semibold">
                    {new Date(app.created_at).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/applications/${app.id}`}>
                      <Button variant="sand" size="sm">Detail</Button>
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
