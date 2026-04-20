import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Kalendář schůzek — Zozio Admin' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDayHeading(dateKey: string) {
  const d = new Date(dateKey + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const dayStart = new Date(dateKey + 'T00:00:00')

  const label = dayStart.getTime() === today.getTime()
    ? 'Dnes'
    : dayStart.getTime() === tomorrow.getTime()
    ? 'Zítra'
    : null

  const dateStr = d.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return { dateStr, label }
}

export default async function CalendarPage() {
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

  if (!institution || institution.type !== 'shelter') redirect('/admin/dashboard')

  const now = new Date()

  // Past meetings (last 30 days)
  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: meetings } = await service
    .from('adoption_applications')
    .select('id, applicant_name, applicant_email, applicant_phone, meeting_at, animal:animals(id, name, species:animal_species(icon, name_cs))')
    .eq('institution_id', institution.id)
    .eq('status', 'meeting_scheduled')
    .not('meeting_at', 'is', null)
    .gte('meeting_at', past30)
    .order('meeting_at', { ascending: true })

  const allMeetings = (meetings ?? []) as any[]

  // Group by date key
  const grouped = new Map<string, any[]>()
  for (const m of allMeetings) {
    const key = formatDateKey(m.meeting_at)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(m)
  }

  const upcomingGroups = [...grouped.entries()].filter(([key]) => key >= formatDateKey(now.toISOString()))
  const pastGroups     = [...grouped.entries()].filter(([key]) => key < formatDateKey(now.toISOString())).reverse()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <div>
          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#2C1810]">
            📅 Kalendář schůzek
          </h1>
          <p className="text-sm text-[#8B6550] mt-0.5 font-semibold">
            Potvrzené termíny pro adopce
          </p>
        </div>
        <Link href="/admin/applications"
          className="text-sm font-bold text-[#E8634A] no-underline hover:text-[#C24D33] transition-colors">
          Všechny žádosti →
        </Link>
      </div>

      {allMeetings.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#F0EDE8] p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <div className="font-display font-extrabold text-lg text-[#2C1810] mb-1">Žádné naplánované schůzky</div>
          <p className="text-sm text-[#8B6550]">
            Jakmile žadatelé potvrdí termín schůzky, zobrazí se zde.
          </p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Nadcházející ── */}
          {upcomingGroups.length > 0 && (
            <section>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#A09890] mb-3">
                Nadcházející
              </div>
              <div className="space-y-5">
                {upcomingGroups.map(([key, dayMeetings]) => {
                  const { dateStr, label } = formatDayHeading(key)
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-2">
                        {label && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-pill"
                            style={{ background: label === 'Dnes' ? '#E8634A' : '#F0A500', color: '#fff' }}>
                            {label}
                          </span>
                        )}
                        <span className="text-sm font-extrabold text-[#2C1810] capitalize">{dateStr.split(',')[0]}</span>
                        <span className="text-sm text-[#8B6550] font-semibold">{dateStr.split(',').slice(1).join(',').trim()}</span>
                        <span className="text-xs text-[#A09890] ml-auto font-semibold">{dayMeetings.length}×</span>
                      </div>
                      <div className="space-y-2">
                        {dayMeetings.map((m: any) => (
                          <MeetingCard key={m.id} meeting={m} isPast={false} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Proběhlé (posledních 30 dní) ── */}
          {pastGroups.length > 0 && (
            <section>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#A09890] mb-3">
                Proběhlé (posledních 30 dní)
              </div>
              <div className="space-y-5">
                {pastGroups.map(([key, dayMeetings]) => {
                  const { dateStr } = formatDayHeading(key)
                  return (
                    <div key={key} className="opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-extrabold text-[#2C1810] capitalize">{dateStr.split(',')[0]}</span>
                        <span className="text-sm text-[#8B6550] font-semibold">{dateStr.split(',').slice(1).join(',').trim()}</span>
                        <span className="text-xs text-[#A09890] ml-auto font-semibold">{dayMeetings.length}×</span>
                      </div>
                      <div className="space-y-2">
                        {dayMeetings.map((m: any) => (
                          <MeetingCard key={m.id} meeting={m} isPast={true} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

function MeetingCard({ meeting, isPast }: { meeting: any; isPast: boolean }) {
  const animal = meeting.animal as { id: string; name: string; species: { icon: string; name_cs: string } | null } | null
  const timeStr = new Date(meeting.meeting_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })

  return (
    <Link href={`/admin/applications/${meeting.id}`} className="no-underline block">
      <div className={`flex items-center gap-3 p-3.5 rounded-lg border transition-colors
        ${isPast
          ? 'bg-[#F9F8F6] border-[#F0EDE8] hover:bg-[#F5F3EF]'
          : 'bg-white border-[#F0EDE8] hover:border-[#E8634A]/30 shadow-sm'
        }`}>

        {/* Čas */}
        <div className="shrink-0 w-14 text-center">
          <div className={`font-display font-extrabold text-lg leading-none ${isPast ? 'text-[#A09890]' : 'text-[#E8634A]'}`}>
            {timeStr}
          </div>
        </div>

        <div className="w-px self-stretch bg-[#F0EDE8] shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-display font-extrabold text-sm text-[#2C1810] truncate">
              {meeting.applicant_name}
            </span>
          </div>
          {animal && (
            <div className="text-xs text-[#8B6550] font-semibold truncate">
              {animal.species?.icon} {animal.name}
              {animal.species?.name_cs && <span className="text-[#A09890]"> · {animal.species.name_cs}</span>}
            </div>
          )}
          {meeting.applicant_phone && (
            <div className="text-xs text-[#A09890] mt-0.5 font-semibold">
              📞 {meeting.applicant_phone}
            </div>
          )}
        </div>

        <span className="text-[#C8C0B8] text-sm shrink-0">→</span>
      </div>
    </Link>
  )
}
