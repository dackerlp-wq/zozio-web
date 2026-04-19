'use client'
import { useState } from 'react'
import { SuperadminUserActions } from './SuperadminUserActions'

type Role = string

interface UserRow {
  id: string
  email: string
  created_at: string
  role: Role
  memberRole: string | null
  instName: string | null
  instType: string | null
}

interface UsersTableProps {
  users: UserRow[]
}

const ROLE_BADGE: Record<string, { label: string; classes: string }> = {
  superadmin:        { label: '⚡ Superadmin',     classes: 'bg-amber-light text-warning' },
  institution_admin: { label: '🏢 Správce inst.',  classes: 'bg-coral-light text-coral-dark' },
  staff:             { label: '👷 Pracovník',      classes: 'bg-sand text-brown' },
  public:            { label: '👤 Veřejný',        classes: 'bg-gray-pale text-gray' },
}

export function UsersTable({ users }: UsersTableProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? users.filter(u =>
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        (u.instName ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : users

  const badge = (role: string) =>
    ROLE_BADGE[role] ?? { label: role, classes: 'bg-gray-pale text-gray' }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Hledat podle e-mailu nebo instituce…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 text-sm font-body text-espresso bg-white border border-gray-pale rounded-pill
            focus:outline-none focus:border-gray-light transition-colors placeholder:text-gray"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-pale">
          <div className="text-5xl mb-3">👥</div>
          <p className="font-display font-bold text-lg text-gray">
            {query ? 'Žádní uživatelé neodpovídají hledání' : 'Žádní uživatelé'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-pale overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-pale bg-sand/50">
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">E-mail</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Instituce</th>
                <th className="text-left px-5 py-3 font-body text-xs font-bold text-gray uppercase tracking-wider">Registrace</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const { label, classes } = badge(user.role)
                return (
                  <tr key={user.id} className="border-b border-gray-pale/50 hover:bg-sand/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-body font-semibold text-sm text-espresso">{user.email}</div>
                      <div className="text-xs text-gray font-mono">{user.id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold ${classes}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {user.instName ? (
                        <div>
                          <div className="font-body font-semibold text-sm text-espresso">{user.instName}</div>
                          <div className={`text-[10px] font-bold ${user.instType === 'shelter' ? 'text-coral' : 'text-rescue'}`}>
                            {user.instType === 'shelter' ? '🏠 Útulok' : '🚑 Záchranná st.'} · {user.memberRole}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray font-semibold">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('cs-CZ') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {user.role !== 'superadmin' && (
                        <SuperadminUserActions
                          userId={user.id}
                          currentRole={user.role}
                          userEmail={user.email}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
