import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

export default async function SuperadminUsersPage() {
  const service = createServiceClient()

  const { data: users } = await service.auth.admin.listUsers()
  const { data: profiles } = await service.from('profiles').select('id, role')
  const { data: members } = await service
    .from('institution_members')
    .select('user_id, role, institution:institutions(name, type)')

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.role]))
  const memberMap = Object.fromEntries(
    (members ?? []).map(m => [m.user_id, m])
  )

  return (
    <div className="min-h-screen bg-gray-pale/30">
      <div className="bg-espresso px-8 py-4 flex items-center gap-4">
        <Link href="/superadmin" className="text-xs text-gray-light hover:text-white transition-colors font-semibold">
          ← Superadmin
        </Link>
        <span className="text-gray/40">·</span>
        <span className="text-sm font-bold text-white">Uživatelé</span>
      </div>

      <div className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-extrabold text-4xl text-espresso">
            👥 Uživatelé
          </h1>
          <span className="text-sm text-gray font-semibold">{users?.users?.length ?? 0} celkem</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-pale overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-pale bg-sand/50">
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">E-mail</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Instituce</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Registrace</th>
              </tr>
            </thead>
            <tbody>
              {(users?.users ?? []).map((user, i) => {
                const role    = profileMap[user.id] ?? 'user'
                const member  = memberMap[user.id]
                const inst    = (member?.institution as { name: string; type: string } | null)

                return (
                  <tr key={user.id} className="border-b border-gray-pale/50 hover:bg-sand/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-body font-semibold text-sm text-espresso">{user.email}</div>
                      <div className="text-xs text-gray font-mono">{user.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold
                        ${role === 'superadmin' ? 'bg-amber-light text-warning' : 'bg-gray-pale text-gray'}`}>
                        {role === 'superadmin' ? '⚡ Superadmin' : '👤 User'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {inst ? (
                        <div>
                          <div className="font-body font-semibold text-sm text-espresso">{inst.name}</div>
                          <div className={`text-[10px] font-bold ${inst.type === 'shelter' ? 'text-coral' : 'text-rescue'}`}>
                            {inst.type === 'shelter' ? '🏠 Útulok' : '🚑 Záchranná st.'} · {member?.role}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray font-semibold">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('cs-CZ') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
