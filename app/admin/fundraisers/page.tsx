import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default async function AdminFundraisersPage() {
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

  const { data: fundraisers } = await service
    .from('fundraisers')
    .select('*, animal:animals(name), rescue_case:rescue_cases(name, case_number)')
    .eq('institution_id', membership.institution_id)
    .order('created_at', { ascending: false })

  const items = (fundraisers ?? []) as any[]
  const active = items.filter(f => f.active).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">💛 Sbírky</h1>
          <p className="text-gray mt-1 font-semibold text-sm">
            {items.length} celkem · {active} aktivních
          </p>
        </div>
        <Link href="/admin/fundraisers/new">
          <Button variant="primary" size="sm">+ Nová sbírka</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-pale">
          <div className="text-5xl mb-4">💛</div>
          <h3 className="font-display font-bold text-xl text-espresso mb-2">Zatím žádné sbírky</h3>
          <p className="text-gray mb-6 text-sm">Vytvoř první sbírku pro konkrétní zvíře nebo projekt.</p>
          <Link href="/admin/fundraisers/new">
            <Button variant="primary">+ Vytvořit sbírku</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((f: any) => {
            const percent = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
            const linked = f.animal?.name ?? f.rescue_case?.name ?? f.rescue_case?.case_number ?? null

            return (
              <div key={f.id} className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-extrabold text-lg text-espresso truncate">{f.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-bold flex-shrink-0
                        ${f.active ? 'bg-success-bg text-success' : 'bg-gray-pale text-gray'}`}>
                        {f.active ? '● Aktivní' : '○ Neaktivní'}
                      </span>
                    </div>
                    {linked && <div className="text-xs text-gray mb-2">Pro: {linked}</div>}
                    {f.description && <p className="text-sm text-brown-mid line-clamp-1">{f.description}</p>}
                  </div>

                  <div className="flex flex-col gap-2 md:min-w-[200px]">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-espresso">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                      <span className="text-gray text-xs">z {f.goal_amount.toLocaleString('cs-CZ')} Kč</span>
                    </div>
                    <div className="w-full h-2 bg-gray-pale rounded-pill overflow-hidden">
                      <div className="h-full bg-coral rounded-pill" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="text-xs text-coral font-bold">{percent}% vybráno</div>
                  </div>

                  <Link href={`/admin/fundraisers/${f.id}`} className="flex-shrink-0">
                    <Button variant="sand" size="sm">Upravit</Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
