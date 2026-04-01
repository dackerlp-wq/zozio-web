import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { VolunteerActions } from '@/components/admin/VolunteerActions'
import type { Volunteer } from '@/types/database'

type VolunteerRow = Volunteer & { activities?: string[]; message?: string | null }

const activityLabel: Record<string, string> = {
  walking:   '🦮 Venčení',
  events:    '📅 Akce',
  transport: '🚗 Transport',
  care:      '🤝 Péče',
  fostering: '🏠 Foster',
  other:     '💡 Jiné',
}

const statusLabel: Record<string, string> = {
  pending:  '⏳ Nový',
  active:   '✓ Aktivní',
  inactive: '○ Neaktivní',
  rejected: '✗ Odmítnut',
}

const statusColor: Record<string, string> = {
  pending:  'bg-amber-light text-warning',
  active:   'bg-success-bg text-success',
  inactive: 'bg-gray-pale text-gray',
  rejected: 'bg-coral-light text-coral-dark',
}

export default async function AdminVolunteersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const { data: volunteers } = await service
    .from('volunteers')
    .select('*')
    .eq('institution_id', membership.institution_id)
    .order('created_at', { ascending: false })

  const items = (volunteers ?? []) as VolunteerRow[]
  const pending = items.filter(v => v.status === 'pending').length
  const active  = items.filter(v => v.status === 'active').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">🙋 Dobrovolníci</h1>
          <p className="text-gray mt-1 font-semibold text-sm">
            {active} aktivních
            {pending > 0 && <span className="ml-2 text-coral font-bold">· {pending} nových žádostí</span>}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-pale">
          <div className="text-5xl mb-4">🙋</div>
          <h3 className="font-display font-bold text-xl text-espresso mb-2">Zatím žádní dobrovolníci</h3>
          <p className="text-gray text-sm max-w-[400px] mx-auto">
            Dobrovolníci se zobrazí zde, jakmile se přihlásí přes váš veřejný profil.
          </p>
        </div>
      ) : (
        <>
          {/* Mobilní karty */}
          <div className="md:hidden space-y-3">
            {items.map((v) => (
              <div key={v.id} className={`bg-white rounded-lg p-4 border shadow-sm ${v.status === 'pending' ? 'border-amber' : 'border-gray-pale'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-display font-bold text-base text-espresso">{v.name}</div>
                    <div className="text-xs text-gray">{v.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold ${statusColor[v.status] ?? 'bg-gray-pale text-gray'}`}>
                    {statusLabel[v.status] ?? v.status}
                  </span>
                </div>
                {(v.activities?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {v.activities?.map((a: string) => (
                      <span key={a} className="inline-flex items-center px-2 py-0.5 bg-sand rounded-pill text-xs font-semibold text-brown">
                        {activityLabel[a] ?? a}
                      </span>
                    ))}
                  </div>
                )}
                {v.message && (
                  <p className="text-xs text-brown-mid mb-3 line-clamp-2">{v.message}</p>
                )}
                <VolunteerActions volunteerId={v.id} currentStatus={v.status} />
              </div>
            ))}
          </div>

          {/* Desktop tabulka */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-pale overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-pale bg-sand/50">
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Dobrovolník</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Aktivity</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Zpráva</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Stav</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Přihlášen</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((v) => (
                  <tr key={v.id} className={`border-b border-gray-pale/50 hover:bg-sand/20 transition-colors ${v.status === 'pending' ? 'bg-amber-light/10' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-display font-bold text-sm text-espresso">{v.name}</div>
                      <div className="text-xs text-gray">{v.email}</div>
                      {v.phone && <div className="text-xs text-gray">{v.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(v.activities ?? []).map((a: string) => (
                          <span key={a} className="inline-flex items-center px-2 py-0.5 bg-sand rounded-pill text-xs font-semibold text-brown">
                            {activityLabel[a] ?? a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px]">
                      {v.message && (
                        <p className="text-xs text-brown-mid line-clamp-2">{v.message}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold ${statusColor[v.status] ?? 'bg-gray-pale text-gray'}`}>
                        {statusLabel[v.status] ?? v.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray font-semibold">
                      {new Date(v.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <VolunteerActions volunteerId={v.id} currentStatus={v.status} />
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
