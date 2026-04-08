import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ApplicationActions } from '@/components/admin/ApplicationActions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()
  const { data: membership } = await service.from('institution_members').select('role, institution_id').eq('user_id', user.id).single()
  const institution = membership ? await service.from('institutions').select('id').eq('id', membership.institution_id).single() : null

  const { data: app, error } = await service
    .from('adoption_applications')
    .select('*, animal:animals(id, name, species:animal_species(name_cs, icon))')
    .eq('id', id)
    .eq('institution_id', institution?.data?.id ?? '')
    .single()

  if (error || !app) notFound()

  const animal = (app.animal as unknown) as { id: string; name: string; species: { name_cs: string; icon: string } | null } | null

  return (
    <div>
      <nav className="flex items-center gap-2 text-sm text-gray mb-5 md:mb-6 font-semibold">
        <Link href="/admin/applications" className="hover:text-coral transition-colors">← Žádosti</Link>
        <span>·</span>
        <span className="text-espresso truncate">{app.applicant_name}</span>
      </nav>

      {/* Mobile: stack, Desktop: grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 md:gap-6">

        {/* Hlavní info */}
        <div className="lg:col-span-2 space-y-4 md:space-y-5">

          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-pale shadow-sm">
            <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-4">👤 Žadatel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Jméno" value={app.applicant_name} />
              <InfoRow label="E-mail" value={app.applicant_email} />
              <InfoRow label="Telefon" value={app.applicant_phone ?? '—'} />
              <InfoRow label="Podáno" value={new Date(app.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-pale shadow-sm">
            <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-4">🏡 Bydlení</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Typ bydlení" value={
                app.housing_type === 'house' ? 'Rodinný dům' :
                app.housing_type === 'apartment' ? 'Byt' :
                app.housing_type === 'farm' ? 'Farma' : app.housing_type ?? '—'
              } />
              <InfoRow label="Zahrada" value={app.has_garden === true ? '✓ Ano' : app.has_garden === false ? '✗ Ne' : '—'} />
              <InfoRow label="Děti" value={app.has_children === true ? `✓ Ano${app.children_ages ? ` (${app.children_ages})` : ''}` : app.has_children === false ? '✗ Ne' : '—'} />
              <InfoRow label="Jiná zvířata" value={app.other_pets ?? '—'} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-pale shadow-sm">
            <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-4">💭 Motivace</h2>
            {app.experience && (
              <div className="mb-4">
                <div className="text-xs font-bold text-gray uppercase tracking-wider mb-1.5">Zkušenosti</div>
                <p className="text-sm text-brown-mid leading-relaxed bg-sand/50 rounded-md p-3">{app.experience}</p>
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-gray uppercase tracking-wider mb-1.5">Motivace k adopci</div>
              <p className="text-sm text-brown-mid leading-relaxed bg-coral-light/30 rounded-md p-3">{app.motivation}</p>
            </div>
          </div>

          {app.staff_notes && (
            <div className="bg-amber-light/50 rounded-lg p-4 md:p-5 border border-amber/20">
              <div className="text-xs font-bold text-warning uppercase tracking-wider mb-1.5">Interní poznámky</div>
              <p className="text-sm text-brown-mid">{app.staff_notes}</p>
            </div>
          )}
        </div>

        {/* Pravý panel */}
        <div className="space-y-4 md:space-y-5">

          {animal && (
            <div className="bg-coral-light rounded-lg p-4 md:p-5">
              <div className="text-xs font-bold text-coral-dark uppercase tracking-wider mb-2">Žádost o</div>
              <div className="font-display font-extrabold text-xl md:text-2xl text-espresso">
                {animal.species?.icon} {animal.name}
              </div>
              <div className="text-xs text-gray mt-1 font-semibold">{animal.species?.name_cs}</div>
              <Link href={`/animals/${animal.id}`} target="_blank">
                <Button variant="ghost" size="sm" className="mt-3 w-full justify-center">
                  Zobrazit profil zvířete ↗
                </Button>
              </Link>
            </div>
          )}

          <ApplicationActions
            applicationId={app.id}
            currentStatus={app.status}
            applicantEmail={app.applicant_email}
            applicantName={app.applicant_name}
          />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-espresso">{value}</div>
    </div>
  )
}
