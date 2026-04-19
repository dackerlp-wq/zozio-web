import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const STATUS_LABEL: Record<string, string> = {
  available:      'K adopci',
  reserved:       'Rezervováno',
  adopted:        'Adoptováno',
  foster:         'Pěstounská péče',
  intake:         'V příjmu',
  treatment:      'Léčba',
  rehabilitation: 'Rehabilitace',
  released:       'Propuštěno',
  deceased:       'Uhynulo',
}

const SHELTER_STATUSES = [
  { key: 'intake',         label: 'V příjmu',       color: '#185FA5', bg: '#EBF4FF' },
  { key: 'available',      label: 'K adopci',        color: '#D4471C', bg: '#FDEAE6' },
  { key: 'reserved',       label: 'Rezervováno',     color: '#8B6550', bg: '#F5E6D3' },
  { key: 'foster',         label: 'Pěstounská péče', color: '#2A7D4F', bg: '#E6F7ED' },
  { key: 'treatment',      label: 'Léčba',           color: '#A05000', bg: '#FFF3D6' },
  { key: 'rehabilitation', label: 'Rehabilitace',    color: '#7B46B0', bg: '#F3EDFB' },
]

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `před ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `před ${hours} h`
  return `před ${Math.floor(hours / 24)} dny`
}

export default async function DashboardPage() {
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

  if (!institution) redirect('/auth/register')

  const now             = new Date()
  const thisMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const longStayDate    = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [animalsData, applicationsData, fundraisersData, volunteersData, longStayData] =
    await Promise.all([
      service.from('animals').select('adoption_status, intake_date, created_at').eq('institution_id', institution.id),
      service.from('adoption_applications').select('status, created_at').eq('institution_id', institution.id),
      service.from('fundraisers').select('title, goal_amount, current_amount, active').eq('institution_id', institution.id).eq('active', true),
      service.from('volunteers').select('status').eq('institution_id', institution.id),
      service.from('animals').select('id, name, intake_date').eq('institution_id', institution.id).eq('adoption_status', 'available').lt('intake_date', longStayDate).order('intake_date', { ascending: true }).limit(5),
    ])

  const animals      = (animalsData.data    ?? []) as any[]
  const applications = ((applicationsData as any).data ?? []) as any[]
  const fundraisers  = (fundraisersData.data ?? []) as any[]
  const volunteers   = (volunteersData.data  ?? []) as any[]
  const longStay     = (longStayData.data    ?? []) as any[]

  // Počty stavů
  const inactiveStatuses = ['adopted', 'deceased']
  const totalInCare = animals.filter((a: any) => !inactiveStatuses.includes(a.adoption_status)).length

  const adoptedTotal = animals.filter((a: any) => a.adoption_status === 'adopted').length

  const newThisMonth = animals.filter((a: any) =>
    new Date(a.intake_date ?? a.created_at) >= new Date(thisMonthStart)
  ).length

  const adoptedThisMonth = applications.filter((a: any) => a.status === 'adopted' && new Date(a.created_at) >= new Date(thisMonthStart)).length

  const newLastMonth = animals.filter((a: any) => {
    const d = new Date(a.intake_date ?? a.created_at)
    return d >= new Date(lastMonthStart) && d < new Date(thisMonthStart)
  }).length

  const trend = newLastMonth > 0
    ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
    : newThisMonth > 0 ? 100 : 0

  const avgStayDays = (() => {
    const withIntake = animals.filter((a: any) => a.intake_date)
    if (!withIntake.length) return null
    const total = withIntake.reduce((sum: number, a: any) => {
      return sum + Math.floor((now.getTime() - new Date(a.intake_date).getTime()) / 86400000)
    }, 0)
    return Math.round(total / withIntake.length)
  })()

  const pendingApplications = applications.filter((a: any) => a.status === 'pending').length
  const activeVolunteers    = volunteers.filter((v: any) => v.status === 'active').length
  const pendingVolunteers   = volunteers.filter((v: any) => v.status === 'pending').length

  // Status breakdown
  const statusBreakdown = SHELTER_STATUSES
    .map(s => ({ ...s, count: animals.filter((a: any) => a.adoption_status === s.key).length }))
    .filter(s => s.count > 0)

  // Čekající žádosti
  let recentApplications: any[] = []
  try {
    const { data } = await service
      .from('adoption_applications')
      .select('id, applicant_name, status, created_at, animal:animals(name, species:animal_species(name_cs))')
      .eq('institution_id', institution.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)
    recentApplications = data ?? []
  } catch { recentApplications = [] }

  // Aktivita
  let activity: any[] = []
  try {
    const { data } = await service
      .from('animal_status_history')
      .select('id, changed_at, new_status, animal:animals!animal_status_history_animal_id_fkey(id, name, institution_id)')
      .order('changed_at', { ascending: false })
      .limit(30)
    activity = (data ?? []).filter((h: any) => h.animal?.institution_id === institution.id).slice(0, 10)
  } catch { activity = [] }

  const todayStr = now.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4 pb-24 md:pb-8">

      {/* ── Hlavička ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#A09890] capitalize">{todayStr}</p>
          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#2C1810] leading-tight mt-0.5">
            {institution.name}
          </h1>
        </div>
        <Link href="/admin/animals/new" className="shrink-0">
          <Button variant="primary" size="sm">
            + Přidat zvíře
          </Button>
        </Link>
      </div>

      {/* ── Alerty ── */}
      {(pendingApplications > 0 || longStay.length > 0 || pendingVolunteers > 0) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {pendingApplications > 0 && (
            <Link href="/admin/applications" className="no-underline flex-1">
              <div className="flex items-center gap-3 px-4 py-3 bg-[#FFF8E6] border border-[#F0A500]/40 rounded-lg hover:bg-[#FFF3D6] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#F0A500] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                  {pendingApplications}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#2C1810]">Nové žádosti o adopci</div>
                  <div className="text-xs text-[#8B6550]">Čekají na vaše rozhodnutí</div>
                </div>
                <span className="ml-auto text-[#A09890] text-lg">→</span>
              </div>
            </Link>
          )}
          {longStay.length > 0 && (
            <Link href="/admin/animals?status=available" className="no-underline flex-1">
              <div className="flex items-center gap-3 px-4 py-3 bg-[#FFF0ED] border border-[#E8634A]/30 rounded-lg hover:bg-[#FDEAE6] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#E8634A] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                  {longStay.length}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#2C1810]">Čekají 90+ dní</div>
                  <div className="text-xs text-[#8B6550]">Potřebují zvýšenou pozornost</div>
                </div>
                <span className="ml-auto text-[#A09890] text-lg">→</span>
              </div>
            </Link>
          )}
          {pendingVolunteers > 0 && (
            <Link href="/admin/volunteers" className="no-underline flex-1">
              <div className="flex items-center gap-3 px-4 py-3 bg-[#EFF4FF] border border-[#4B72D4]/30 rounded-lg hover:bg-[#E6EEFF] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#4B72D4] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                  {pendingVolunteers}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#2C1810]">
                    {pendingVolunteers === 1 ? 'Nový dobrovolník' : `Noví dobrovolníci (${pendingVolunteers})`}
                  </div>
                  <div className="text-xs text-[#8B6550]">Čeká na schválení</div>
                </div>
                <span className="ml-auto text-[#A09890] text-lg">→</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* ── Stat karty ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="V péči"
          value={totalInCare}
          sub={`${animals.length} celkem evidováno`}
          href="/admin/animals"
          color="#E8634A"
        />
        <StatTile
          label="Adoptováno"
          value={adoptedTotal}
          sub={adoptedThisMonth > 0 ? `${adoptedThisMonth} tento měsíc` : 'od začátku'}
          href="/admin/animals"
          color="#2A7D4F"
        />
        <StatTile
          label="Čekající žádosti"
          value={pendingApplications}
          sub={`celkem ${applications.length} žádostí`}
          href="/admin/applications"
          color="#F0A500"
          alert={pendingApplications > 0}
        />
        <StatTile
          label="Dobrovolníci"
          value={activeVolunteers}
          sub={pendingVolunteers > 0 ? `${pendingVolunteers} čeká na schválení` : 'aktivní'}
          href="/admin/volunteers"
          color="#4B72D4"
          alert={pendingVolunteers > 0}
        />
      </div>

      {/* ── Status breakdown (útulky) ── */}
      {statusBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusBreakdown.map(s => (
            <Link key={s.key} href={`/admin/animals?status=${s.key}`} className="no-underline">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-75 transition-opacity"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                <span className="font-extrabold text-sm">{s.count}</span>
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Hlavní obsah + pravý sloupec ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-4">

        {/* Levý sloupec */}
        <div className="space-y-4 min-w-0">

          {/* Čekající žádosti */}
          {recentApplications.length > 0 && (
            <div className="bg-white rounded-lg border border-[#F0EDE8] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EDE8]">
                <h2 className="font-display font-extrabold text-sm text-[#2C1810]">Čekající žádosti o adopci</h2>
                <Link href="/admin/applications" className="text-xs font-bold text-[#E8634A] no-underline">
                  Zobrazit vše →
                </Link>
              </div>
              <div>
                {recentApplications.map((app: any) => {
                  const initials = (app.applicant_name as string)
                    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
                  return (
                    <Link key={app.id} href={`/admin/applications/${app.id}`} className="no-underline">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors">
                        <div className="w-8 h-8 rounded-full bg-[#F5E6D3] flex items-center justify-center text-xs font-bold text-[#8B6550] shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-[#2C1810]">{app.applicant_name}</div>
                          <div className="text-xs text-[#8B6550] truncate">
                            {app.animal?.name ?? '—'}
                            {app.animal?.species?.name_cs ? ` · ${app.animal.species.name_cs}` : ''}
                          </div>
                        </div>
                        <div className="text-[11px] text-[#A09890] shrink-0">{relativeTime(app.created_at)}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Trendy – 3 karty */}
          <div className="grid grid-cols-3 gap-3">
            <TrendTile
              label="Nové příjmy"
              value={newThisMonth}
              sub={`min. měsíc: ${newLastMonth}`}
              trend={trend}
            />
            <TrendTile
              label="Adopce"
              value={adoptedThisMonth}
              sub={`celkem: ${adoptedTotal}`}
            />
            <TrendTile
              label="Prům. pobyt"
              value={avgStayDays !== null ? `${avgStayDays} dní` : '—'}
              sub="aktuální zvířata"
            />
          </div>

          {/* Nejdéle v útulku */}
          {longStay.length > 0 && (
            <div className="bg-white rounded-lg border border-[#F0EDE8] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EDE8]">
                <h2 className="font-display font-extrabold text-sm text-[#2C1810]">Nejdéle v útulku</h2>
                <Link href="/admin/animals?status=available" className="text-xs font-bold text-[#E8634A] no-underline">
                  Vše →
                </Link>
              </div>
              <div>
                {longStay.map((a: any) => {
                  const days = Math.floor((now.getTime() - new Date(a.intake_date).getTime()) / 86400000)
                  const isCritical = days > 180
                  return (
                    <Link key={a.id} href={`/admin/animals/${a.id}`} className="no-underline">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-[#2C1810]">{a.name ?? a.case_number}</div>
                          <div className="text-xs text-[#8B6550]">
                            v útulku od {new Date(a.intake_date).toLocaleDateString('cs-CZ')}
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                          isCritical ? 'bg-[#FDEAE6] text-[#993C1D]' : 'bg-[#FFF3D6] text-[#A05000]'
                        }`}>
                          {days} dní
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Aktivní sbírky */}
          {fundraisers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-extrabold text-sm text-[#2C1810]">Aktivní sbírky</h2>
                <Link href="/admin/fundraisers" className="text-xs font-bold text-[#E8634A] no-underline">
                  Spravovat →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fundraisers.map((f: any) => {
                  const percent = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
                  return (
                    <div key={f.title} className="bg-white rounded-lg p-4 border border-[#F0EDE8]">
                      <div className="font-bold text-sm text-[#2C1810] mb-2 leading-snug">{f.title}</div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-bold text-[#2C1810]">
                          {f.current_amount.toLocaleString('cs-CZ')} Kč
                        </span>
                        <span className="text-[#A09890]">
                          cíl: {f.goal_amount.toLocaleString('cs-CZ')} Kč
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E8634A] rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-xs font-bold text-[#E8634A] mt-1.5">{percent} % vybráno</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pravý sloupec */}
        <div className="space-y-4">

          {/* Rychlé akce */}
          <div>
            <h2 className="font-display font-extrabold text-sm text-[#2C1810] mb-2">Rychlé akce</h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <QuickBtn href="/admin/animals/new" label="Přidat zvíře" primary />
              <QuickBtn href="/admin/applications" label="Žádosti o adopci" badge={pendingApplications || undefined} />
              <QuickBtn href="/admin/fundraisers/new" label="Nová sbírka" />
              <QuickBtn href="/admin/volunteers" label="Dobrovolníci" badge={pendingVolunteers || undefined} />
              <QuickBtn href="/admin/articles/new" label="Nový článek" />
              <QuickBtn href="/admin/settings" label="Nastavení" />
            </div>
          </div>

          {/* Poslední aktivita */}
          <div className="bg-white rounded-lg border border-[#F0EDE8] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F0EDE8]">
              <h2 className="font-display font-extrabold text-sm text-[#2C1810]">Poslední aktivita</h2>
            </div>
            {activity.length === 0 ? (
              <p className="text-xs text-[#A09890] px-4 py-6 text-center">Zatím žádná aktivita</p>
            ) : (
              <div>
                {activity.map((h: any) => (
                  <Link key={h.id} href={`/admin/animals/${h.animal?.id}`} className="no-underline">
                    <div className="flex items-start gap-3 px-4 py-2.5 border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E8634A] mt-[5px] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#2C1810] truncate">{h.animal?.name ?? '—'}</div>
                        <div className="text-[11px] text-[#A09890]">
                          → {STATUS_LABEL[h.new_status] ?? h.new_status} · {relativeTime(h.changed_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Inline komponenty ──────────────────────────────────────────────────────────

function StatTile({ label, value, sub, href, color, alert = false }: {
  label: string; value: number | string; sub?: string; href: string; color: string; alert?: boolean
}) {
  return (
    <Link href={href} className="no-underline">
      <div className={`bg-white rounded-lg border ${alert ? 'border-[#F0A500]' : 'border-[#F0EDE8]'} p-4 hover:shadow-sm transition-all h-full`}>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#A09890] mb-1 leading-none">{label}</div>
        <div className="font-display font-extrabold text-2xl leading-none" style={{ color }}>{value}</div>
        {sub && <div className="text-[11px] text-[#A09890] mt-1 leading-tight">{sub}</div>}
      </div>
    </Link>
  )
}

function TrendTile({ label, value, sub, trend }: {
  label: string; value: number | string; sub?: string; trend?: number
}) {
  return (
    <div className="bg-white rounded-lg border border-[#F0EDE8] p-3 sm:p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#A09890] mb-1 leading-none">{label}</div>
      <div className="flex items-end gap-1.5 flex-wrap">
        <span className="font-display font-extrabold text-xl text-[#2C1810] leading-none">{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs font-bold ${trend > 0 ? 'text-[#E8634A]' : 'text-[#2A7D4F]'}`}>
            {trend > 0 ? `↑ ${trend} %` : `↓ ${Math.abs(trend)} %`}
          </span>
        )}
      </div>
      {sub && <div className="text-[11px] text-[#A09890] mt-1">{sub}</div>}
    </div>
  )
}

function QuickBtn({ href, label, primary = false, badge }: {
  href: string; label: string; primary?: boolean; badge?: number
}) {
  return (
    <Link href={href} className="no-underline relative">
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#E8634A] text-white text-[10px] font-bold flex items-center justify-center z-10">
          {badge}
        </span>
      )}
      <div className={`w-full rounded-lg px-3 py-2.5 text-xs font-bold text-center transition-colors ${
        primary
          ? 'bg-[#E8634A] text-white hover:bg-[#d4553e]'
          : 'bg-white border border-[#F0EDE8] text-[#2C1810] hover:border-[#E8634A] hover:text-[#E8634A]'
      }`}>
        {label}
      </div>
    </Link>
  )
}
