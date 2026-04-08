import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `před ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `před ${hours} h`
  return `před ${Math.floor(hours / 24)} dny`
}

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

  const isShelter = institution.type === 'shelter'
  const now = new Date()
  const longStayDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Minimální data pro dashboard — jen co je potřeba pro alerty a akční widgety
  const [applicationsCountData, volunteersData, longStayData] = await Promise.all([
    isShelter
      ? service.from('adoption_applications').select('status').eq('institution_id', institution.id)
      : Promise.resolve({ data: [] }),
    service.from('volunteers').select('status').eq('institution_id', institution.id),
    isShelter
      ? service.from('animals')
          .select('id, name, intake_date')
          .eq('institution_id', institution.id)
          .eq('adoption_status', 'available')
          .lt('intake_date', longStayDate)
          .order('intake_date', { ascending: true })
          .limit(5)
      : service.from('rescue_cases')
          .select('id, name, case_number, intake_date')
          .eq('institution_id', institution.id)
          .in('status', ['intake', 'treatment', 'rehabilitation'])
          .lt('intake_date', longStayDate)
          .order('intake_date', { ascending: true })
          .limit(5),
  ])

  const allApplications = ((applicationsCountData as any).data ?? []) as any[]
  const volunteers = (volunteersData.data ?? []) as any[]
  const longStay   = (longStayData.data ?? []) as any[]

  const pendingApplications = allApplications.filter((a: any) => a.status === 'pending').length
  const pendingVolunteers   = volunteers.filter((v: any) => v.status === 'pending').length

  // Čekající žádosti (detailní pro seznam)
  let recentApplications: any[] = []
  if (isShelter) {
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
  }

  // Nadcházející potvrzené schůzky
  let upcomingMeetings: any[] = []
  if (isShelter) {
    try {
      const { data } = await service
        .from('adoption_applications')
        .select('id, applicant_name, applicant_phone, meeting_at, animal:animals(name, species:animal_species(icon, name_cs))')
        .eq('institution_id', institution.id)
        .eq('status', 'meeting_scheduled')
        .not('meeting_at', 'is', null)
        .gte('meeting_at', now.toISOString())
        .order('meeting_at', { ascending: true })
        .limit(5)
      upcomingMeetings = data ?? []
    } catch { upcomingMeetings = [] }
  }

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
          <Button variant={isShelter ? 'primary' : 'rescue'} size="sm">
            + {isShelter ? 'Přidat zvíře' : 'Nový pacient'}
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

      {/* ── Hlavní obsah + pravý sloupec ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-4">

        {/* Levý sloupec */}
        <div className="space-y-4 min-w-0">

          {/* Čekající žádosti */}
          {isShelter && recentApplications.length > 0 && (
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

          {/* Nadcházející schůzky */}
          {isShelter && upcomingMeetings.length > 0 && (
            <div className="bg-white rounded-lg border border-[#F0EDE8] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EDE8]">
                <h2 className="font-display font-extrabold text-sm text-[#2C1810]">📅 Nadcházející schůzky</h2>
                <Link href="/admin/calendar" className="text-xs font-bold text-[#E8634A] no-underline">
                  Kalendář →
                </Link>
              </div>
              <div>
                {upcomingMeetings.map((app: any) => {
                  const meetingDate = new Date(app.meeting_at)
                  const isToday    = meetingDate.toDateString() === now.toDateString()
                  const isTomorrow = meetingDate.toDateString() === new Date(now.getTime() + 86400000).toDateString()
                  const dayLabel   = isToday ? 'Dnes' : isTomorrow ? 'Zítra'
                    : meetingDate.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })
                  const timeLabel  = meetingDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <Link key={app.id} href={`/admin/applications/${app.id}`} className="no-underline">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors">
                        <div className="w-10 text-center shrink-0">
                          <div className="text-[10px] font-bold uppercase" style={{ color: isToday ? '#E8634A' : '#8B6550' }}>{dayLabel}</div>
                          <div className="text-sm font-extrabold" style={{ color: isToday ? '#E8634A' : '#2C1810' }}>{timeLabel}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-[#2C1810] truncate">{app.applicant_name}</div>
                          <div className="text-xs text-[#8B6550] truncate">
                            {app.animal?.species?.icon} {app.animal?.name ?? '—'}
                            {app.applicant_phone ? ` · ${app.applicant_phone}` : ''}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: '#EAF3DE', color: '#3B6D11' }}>✅</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Nejdéle v útulku — akční upozornění */}
          {longStay.length > 0 && (
            <div className="bg-white rounded-lg border border-[#F0EDE8] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EDE8]">
                <h2 className="font-display font-extrabold text-sm text-[#2C1810]">
                  ⏳ {isShelter ? 'Nejdéle v útulku' : 'Nejdéle v péči'}
                </h2>
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
                            v péči od {new Date(a.intake_date).toLocaleDateString('cs-CZ')}
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
        </div>

        {/* Pravý sloupec */}
        <div className="space-y-4">

          {/* Rychlé akce */}
          <div>
            <h2 className="font-display font-extrabold text-sm text-[#2C1810] mb-2">Rychlé akce</h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <QuickBtn href="/admin/animals/new" label={isShelter ? 'Přidat zvíře' : 'Nový pacient'} primary />
              {isShelter && (
                <QuickBtn href="/admin/applications" label="Žádosti o adopci" badge={pendingApplications || undefined} />
              )}
              <QuickBtn href="/admin/statistics" label="📈 Statistiky" />
              <QuickBtn href="/admin/fundraisers/new" label="Nová sbírka" />
              <QuickBtn href="/admin/volunteers" label="Dobrovolníci" badge={pendingVolunteers || undefined} />
              <QuickBtn href="/admin/articles/new" label="Nový článek" />
              <QuickBtn href="/admin/settings/info" label="Nastavení" />
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
