import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { UsersTable } from '@/components/admin/UsersTable'

export default async function SuperadminUsersPage() {
  const service = createServiceClient()

  const [{ data: users }, { data: profiles }, { data: members }, { data: institutions }] = await Promise.all([
    service.auth.admin.listUsers(),
    service.from('profiles').select('id, role'),
    service.from('institution_members').select('user_id, role, institution_id, institution:institutions(id, name, type)'),
    service.from('institutions').select('id, name, type').order('name'),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.role]))
  const memberMap  = Object.fromEntries((members ?? []).map(m => [m.user_id, m]))

  const rows = (users?.users ?? []).map(user => {
    const member = memberMap[user.id]
    const inst   = (member?.institution as { name: string; type: string } | null) ?? null
    return {
      id:         user.id,
      email:      user.email ?? '',
      created_at: user.created_at ?? '',
      role:       (profileMap[user.id] as string) ?? 'public',
      memberRole: member?.role ?? null,
      instName:   inst?.name ?? null,
      instType:   inst?.type ?? null,
    }
  })

  const total = rows.length

  return (
    <div className="min-h-screen bg-gray-pale/30">
      <div className="bg-espresso px-8 py-4 flex items-center gap-4">
        <Link href="/superadmin" className="text-xs text-gray-light hover:text-white transition-colors font-semibold">
          ← Superadmin
        </Link>
        <span className="text-gray/40">·</span>
        <span className="text-sm font-bold text-white">Uživatelé</span>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-extrabold text-4xl text-espresso">
            👥 Uživatelé
          </h1>
          <span className="text-sm text-gray font-semibold">{total} celkem</span>
        </div>

        <UsersTable users={rows} />
      </div>
    </div>
  )
}
