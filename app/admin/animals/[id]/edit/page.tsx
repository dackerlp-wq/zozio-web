import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AnimalForm } from '@/components/admin/AnimalForm'
import { ScanRedirect } from '@/components/admin/ScanRedirect'

export default async function EditAnimalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ scan?: string }>
}) {
  const { id }   = await params
  const { scan } = await searchParams

  /* ── Auth ── */
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/admin/animals/${id}/edit`)

  const service = createServiceClient()

  /* ── Membership & institution ── */
  const { data: membership } = await service
    .from('institution_members')
    .select('role, institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const { data: rawInstitution } = await service
    .from('institutions')
    .select('id, name, type')
    .eq('id', membership.institution_id)
    .single()

  if (!rawInstitution) redirect('/admin/dashboard')

  /* ── Animal ── */
  const { data: animal } = await service
    .from('animals')
    .select('*')
    .eq('id', id)
    .eq('institution_id', String(rawInstitution.id))
    .single()

  if (!animal) notFound()

  const a = animal as Record<string, unknown>

  /* ── Species (tylko domácí druhy) ── */
  const { data: speciesRows } = await service
    .from('animal_species')
    .select('id, name_cs, icon, category')
    .eq('category', 'domestic')
    .order('name_cs')

  const species = (speciesRows ?? []).map((s) => ({
    id:      String(s.id),
    name_cs: String(s.name_cs),
    icon:    s.icon ? String(s.icon) : null,
  }))

  /* ── Audit log (field-level change history) ── */
  const { data: auditRows } = await service
    .from('animal_audit_log')
    .select('id, changed_at, change_note, changed_by, changes')
    .eq('animal_id', id)
    .order('changed_at', { ascending: false })
    .limit(100)

  const auditLog = (auditRows ?? []).map((r) => ({
    id:          String(r.id),
    changed_at:  String(r.changed_at),
    change_note: r.change_note ? String(r.change_note) : null,
    changed_by:  r.changed_by  ? String(r.changed_by)  : null,
    changes:     Array.isArray(r.changes) ? r.changes as { field: string; label: string; old_value: string; new_value: string }[] : [],
  }))

  /* ── Status history (legacy — kept for backwards compat) ── */
  const statusHistory: { id: string; status: string; changed_at: string; note?: string; changed_by?: string }[] = []

  return (
    <div>
      {/* QR scan flash banner */}
      {scan === '1' && <ScanRedirect animalName={String(a.name ?? a.case_number ?? '')} />}

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <a href="/admin/animals" className="text-sm text-[#8B6550] hover:text-[#E8634A] transition-colors font-semibold">
            ← Zpět
          </a>
          <span className="text-[#D5CFC8]">·</span>
          <a
            href={`/animals/${id}`}
            target="_blank"
            className="text-sm text-[#E8634A] hover:opacity-70 font-semibold transition-opacity"
          >
            Web ↗
          </a>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/admin/animals/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[#F0EDE8] bg-white text-[#6B4030] font-bold text-sm hover:border-[#E8634A] hover:text-[#E8634A] transition-colors"
          >
            <span>📄</span>
            <span className="hidden sm:inline">PDF karta</span>
          </a>
          <a
            href={`/admin/animals/${id}/qr`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2C1810] text-white font-bold text-sm hover:bg-[#6B4030] transition-colors"
          >
            <span>▣</span>
            <span className="hidden sm:inline">QR karta</span>
          </a>
        </div>
      </div>

      <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#2C1810] mb-6">
        {String(a.name ?? a.case_number ?? '')}
      </h1>

      <AnimalForm
        institutionId={String(rawInstitution.id)}
        species={species}
        mode="edit"
        animal={a}
        statusHistory={statusHistory}
        auditLog={auditLog}
        currentUser={{ id: user.id, name: user.email ?? '' }}
      />
    </div>
  )
}
