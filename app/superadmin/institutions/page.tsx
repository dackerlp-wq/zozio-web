import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { InstitutionActions } from '@/components/admin/InstitutionActions'

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function SuperadminInstitutionsPage({ searchParams }: PageProps) {
  const { filter } = await searchParams
  const service = createServiceClient()

  let query = service
    .from('institutions')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter === 'pending') {
    query = query.eq('approval_status', 'pending') as typeof query
  }

  const { data: institutions } = await query
  const items = institutions ?? []

  const counts = {
    all:      items.length,
    pending:  items.filter(i => i.approval_status === 'pending').length,
    approved: items.filter(i => i.approval_status === 'approved').length,
    rejected: items.filter(i => i.approval_status === 'rejected').length,
  }

  const statusColor: Record<string, string> = {
    pending:  'bg-amber-light text-warning',
    approved: 'bg-success-bg text-success',
    rejected: 'bg-gray-pale text-gray',
  }

  const statusLabel: Record<string, string> = {
    pending:  '⏳ Čeká',
    approved: '✓ Schváleno',
    rejected: '✗ Zamítnuto',
  }

  return (
    <div className="min-h-screen bg-gray-pale/30">
      <div className="bg-espresso px-8 py-4 flex items-center gap-4">
        <Link href="/superadmin" className="text-xs text-gray-light hover:text-white transition-colors font-semibold">
          ← Superadmin
        </Link>
        <span className="text-gray/40">·</span>
        <span className="text-sm font-bold text-white">Instituce</span>
      </div>

      <div className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-extrabold text-4xl text-espresso">
            🏢 Instituce
          </h1>
        </div>

        {/* Filtry */}
        <div className="flex gap-3 mb-6">
          {[
            { key: undefined, label: `Všechny (${counts.all})` },
            { key: 'pending',  label: `⏳ Čeká (${counts.pending})` },
            { key: 'approved', label: `✓ Schváleno (${counts.approved})` },
            { key: 'rejected', label: `✗ Zamítnuto (${counts.rejected})` },
          ].map(({ key, label }) => (
            <Link key={label} href={key ? `/superadmin/institutions?filter=${key}` : '/superadmin/institutions'}>
              <button className={`px-4 py-2 rounded-pill font-display font-bold text-sm cursor-pointer transition-all border-2
                ${filter === key || (!filter && !key)
                  ? 'bg-espresso text-white border-espresso'
                  : 'bg-white text-gray border-gray-pale hover:border-gray-light'
                }`}>
                {label}
              </button>
            </Link>
          ))}
        </div>

        {/* Tabulka */}
        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-pale">
            <div className="text-5xl mb-3">🏢</div>
            <p className="font-display font-bold text-lg text-gray">Žádné instituce</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-pale overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-pale bg-sand/50">
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Název</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Typ</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Město</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Plán</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Stav</th>
                  <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Registrace</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((inst, i) => (
                  <tr key={inst.id} className={`border-b border-gray-pale/50 hover:bg-sand/20 transition-colors
                    ${inst.approval_status === 'pending' ? 'bg-amber-light/10' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-display font-bold text-sm text-espresso">{inst.name}</div>
                      <div className="text-xs text-gray">{inst.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-bold
                        ${inst.type === 'shelter' ? 'bg-shelter-bg text-shelter-dark' : 'bg-rescue-bg text-rescue-dark'}`}>
                        {inst.type === 'shelter' ? '🏠 Útulok' : '🚑 Záchranná st.'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray font-semibold">{inst.city}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-bold
                        ${inst.plan === 'free' ? 'bg-gray-pale text-gray' : inst.plan === 'pro' ? 'bg-amber-light text-warning' : 'bg-rescue-bg text-rescue-dark'}`}>
                        {inst.plan?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold
                        ${statusColor[inst.approval_status] ?? 'bg-gray-pale text-gray'}`}>
                        {statusLabel[inst.approval_status] ?? inst.approval_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray font-semibold">
                      {new Date(inst.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <InstitutionActions
                        institutionId={inst.id}
                        currentStatus={inst.approval_status}
                        institutionName={inst.name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
