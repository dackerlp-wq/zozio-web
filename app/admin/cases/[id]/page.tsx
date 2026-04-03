import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

const statusLabels: Record<string, string> = {
  intake: 'Příjem',
  treatment: 'Léčba',
  rehabilitation: 'Rehabilitace',
  released: 'Propuštěno',
  deceased: 'Uhynulo',
}

const rescueBadge: Record<string, { bg: string; color: string }> = {
  intake:         { bg: '#FDEAE6', color: '#993C1D' },
  treatment:      { bg: '#FEF3CD', color: '#7A5200' },
  rehabilitation: { bg: '#E1F5EE', color: '#0F6E56' },
  released:       { bg: '#E6F7ED', color: '#2A7D4F' },
  deceased:       { bg: '#F5F0EC', color: '#8B6550' },
}

function parseNote(note: string | null): string {
  if (!note) return ''
  try {
    const parsed = JSON.parse(note)
    if (parsed.v === 1 && parsed.note) return parsed.note
    if (parsed.v === 1 && parsed.diff?.length > 0) {
      return parsed.diff.map((d: any) => `${d.l}: ${d.o} → ${d.n}`).join(', ')
    }
  } catch {}
  return note
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params

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

  if (!institution) redirect('/admin/dashboard')
  if (institution.type === 'shelter') redirect('/admin/dashboard')

  const { data: rescueCase } = await service
    .from('rescue_cases')
    .select(`
      id, name, case_number, status, cause_of_injury, diagnosis,
      treatment_notes, intake_date, release_date, found_location,
      found_date, found_by, public_description, published,
      species:animal_species(name_cs, icon),
      primary_photo
    `)
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!rescueCase) notFound()

  const { data: history } = await service
    .from('animal_status_history')
    .select('id, changed_at, new_status, old_status, note, changed_by_name')
    .eq('rescue_case_id', id)
    .order('changed_at', { ascending: false })
    .limit(20)

  const rc = rescueCase as any
  const species = rc.species as any
  const badge = rescueBadge[rc.status] ?? { bg: '#F5F0EC', color: '#8B6550' }
  const statusLabel = statusLabels[rc.status] ?? rc.status
  const historyList = (history ?? []) as any[]

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/cases"
        className="inline-flex items-center gap-1 text-sm font-bold text-[#8B6550] no-underline hover:text-[#2C1810] mb-6"
      >
        ← Záznamy léčby
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="min-w-0">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: '#F5F0EC' }}
            >
              {species?.icon ?? '🦉'}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-[#2C1810] leading-tight">
                {rc.name ?? rc.case_number}
              </h1>
              {rc.name && (
                <div className="text-xs text-[#8B6550] mt-0.5">{rc.case_number}</div>
              )}
              <div className="mt-2">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold"
                  style={{ backgroundColor: badge.bg, color: badge.color }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white rounded-xl border border-[#F0EDE8] p-4">
              <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1">Datum příjmu</div>
              <div className="text-sm font-bold text-[#2C1810]">
                {rc.intake_date ? new Date(rc.intake_date).toLocaleDateString('cs-CZ') : '—'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#F0EDE8] p-4">
              <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1">Nálezce</div>
              <div className="text-sm font-bold text-[#2C1810]">{rc.found_by ?? '—'}</div>
            </div>

            <div className="bg-white rounded-xl border border-[#F0EDE8] p-4">
              <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1">Místo nálezu</div>
              <div className="text-sm font-bold text-[#2C1810]">{rc.found_location ?? '—'}</div>
            </div>

            <div className="bg-white rounded-xl border border-[#F0EDE8] p-4">
              <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1">Datum nálezu</div>
              <div className="text-sm font-bold text-[#2C1810]">
                {rc.found_date ? new Date(rc.found_date).toLocaleDateString('cs-CZ') : '—'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#F0EDE8] p-4">
              <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1">Příčina</div>
              <div className="text-sm font-bold text-[#2C1810]">{rc.cause_of_injury ?? '—'}</div>
            </div>

            <div className="bg-white rounded-xl border border-[#F0EDE8] p-4">
              <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-1">Diagnóza</div>
              <div className="text-sm font-bold text-[#2C1810]">{rc.diagnosis ?? '—'}</div>
            </div>
          </div>

          {/* Treatment notes */}
          {rc.treatment_notes && (
            <div className="bg-white rounded-2xl border border-[#F0EDE8] p-5 mt-4">
              <h2 className="font-display font-extrabold text-base text-[#2C1810] mb-2">Poznámky k léčbě</h2>
              <p className="text-sm text-[#2C1810] whitespace-pre-wrap">{rc.treatment_notes}</p>
            </div>
          )}

          {/* Public description */}
          {rc.public_description && (
            <div className="bg-white rounded-2xl border border-[#F0EDE8] p-5 mt-4">
              <h2 className="font-display font-extrabold text-base text-[#2C1810] mb-2">Veřejný popis</h2>
              <p className="text-sm text-[#2C1810]">{rc.public_description}</p>
            </div>
          )}

          {/* Edit button */}
          <div className="mt-6">
            <Link
              href={`/admin/animals/${id}`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-sm text-white no-underline"
              style={{ backgroundColor: '#2E9E8F' }}
            >
              ✏️ Upravit v editoru
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Status badge card */}
          <div
            className="rounded-2xl p-5 text-center"
            style={{ backgroundColor: badge.bg }}
          >
            <div className="text-4xl mb-2">{species?.icon ?? '🦉'}</div>
            <div className="font-display font-extrabold text-2xl" style={{ color: badge.color }}>
              {statusLabel}
            </div>
            <div className="text-xs font-semibold mt-1" style={{ color: badge.color }}>
              aktuální stav
            </div>
          </div>

          {/* Timeline card */}
          <div className="bg-white rounded-2xl border border-[#F0EDE8] p-5">
            <h2 className="font-display font-extrabold text-base text-[#2C1810] mb-4">Historie stavů</h2>
            {historyList.length === 0 ? (
              <p className="text-sm text-[#8B6550]">Zatím žádné záznamy</p>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[#F0EDE8]" />
                {historyList.map((h: any) => {
                  const noteText = parseNote(h.note)
                  return (
                    <div key={h.id} className="relative mb-4 last:mb-0">
                      <div className="absolute -left-3 top-1.5 w-2.5 h-2.5 rounded-full bg-[#2E9E8F] border-2 border-white" />
                      <div className="text-xs text-[#8B6550]">
                        {new Date(h.changed_at).toLocaleDateString('cs-CZ', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-sm font-bold text-[#2C1810]">
                        {h.old_status ? `${statusLabels[h.old_status] ?? h.old_status} → ` : ''}
                        {statusLabels[h.new_status] ?? h.new_status}
                      </div>
                      {noteText && (
                        <div className="text-xs text-[#8B6550] mt-0.5">{noteText}</div>
                      )}
                      {h.changed_by_name && (
                        <div className="text-xs text-[#8B6550]">{h.changed_by_name}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
