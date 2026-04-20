import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { ApplicationActions } from '@/components/admin/ApplicationActions'
import { MeetingScheduler } from '@/components/admin/MeetingScheduler'

interface PageProps {
  params: Promise<{ id: string }>
}

const statusLabel: Record<string, { label: string; bg: string; color: string }> = {
  pending:           { label: '⏳ Nová',                  bg: '#FAEEDA', color: '#854F0B' },
  reviewing:         { label: '🔍 Posuzuje se',           bg: '#E1F5EE', color: '#1A6B5A' },
  approved:          { label: '✓ Schválena',              bg: '#EAF3DE', color: '#3B6D11' },
  rejected:          { label: '✗ Zamítnuta',              bg: '#F5F5F5', color: '#6B6B6B' },
  meeting_scheduled: { label: '📅 Schůzka naplánována',  bg: '#FAECE7', color: '#993C1D' },
  adopted:           { label: '🏠 Adoptováno',            bg: '#EAF3DE', color: '#3B6D11' },
  cancelled:         { label: '🚫 Stornováno',            bg: '#F5F5F5', color: '#6B6B6B' },
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
    .select('*, animal:animals(id, name, primary_photo, species:animal_species(name_cs, icon))')
    .eq('id', id)
    .eq('institution_id', institution?.data?.id ?? '')
    .single()

  if (error || !app) notFound()

  const animal  = (app.animal as unknown) as { id: string; name: string; primary_photo?: string; species: { name_cs: string; icon: string } | null } | null
  const st      = statusLabel[app.status] ?? statusLabel['pending']
  const meetingOptions: string[] = Array.isArray(app.meeting_options) ? app.meeting_options : []
  const meetingAt: string | null = app.meeting_at ?? null

  const formatDateTime = (iso: string) => new Date(iso).toLocaleString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div>
      <nav className="flex items-center gap-2 text-sm text-gray mb-5 md:mb-6 font-semibold">
        <Link href="/admin/applications" className="hover:text-coral transition-colors">← Žádosti</Link>
        <span>·</span>
        <span className="text-espresso truncate">{app.applicant_name}</span>
      </nav>

      {/* Mobile: stack, Desktop: grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">

        {/* ── Hlavní info ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Žadatel */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-pale shadow-sm">
            <h2 className="font-display font-extrabold text-base md:text-lg text-espresso mb-4">👤 Žadatel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <InfoRow label="Jméno" value={app.applicant_name} />
              <InfoRow label="E-mail" value={
                <a href={`mailto:${app.applicant_email}`} className="text-coral hover:underline">{app.applicant_email}</a>
              } />
              <InfoRow label="Telefon" value={
                app.applicant_phone
                  ? <a href={`tel:${app.applicant_phone}`} className="text-coral hover:underline">{app.applicant_phone}</a>
                  : '—'
              } />
              <InfoRow label="Lokalita" value={app.applicant_city ?? '—'} />
              <InfoRow label="Podáno" value={new Date(app.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            </div>
          </div>

          {/* Bydlení */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-pale shadow-sm">
            <h2 className="font-display font-extrabold text-base md:text-lg text-espresso mb-4">🏡 Bydlení</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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

          {/* Životní styl */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-pale shadow-sm">
            <h2 className="font-display font-extrabold text-base md:text-lg text-espresso mb-4">🐾 Životní styl a péče</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <InfoRow label="Důvod pořízení" value={
                app.purpose === 'family' ? '🏡 Rodinný pes' :
                app.purpose === 'sport'  ? '🏃 Aktivní / sport' :
                app.purpose === 'guard'  ? '🛡️ Hlídací pes' :
                app.purpose === 'other'  ? 'Jiné' : '—'
              } />
              <InfoRow label="Doma sám" value={
                app.hours_alone_weekday !== null || app.hours_alone_weekend !== null
                  ? `Týden ${app.hours_alone_weekday ?? '?'} h · Víkend ${app.hours_alone_weekend ?? '?'} h`
                  : '—'
              } />
              <div className="sm:col-span-2">
                <InfoRow label="Záložní péče (kdo se postará)" value={app.backup_caregiver ?? '—'} />
              </div>
            </div>
          </div>

          {/* Motivace */}
          <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-pale shadow-sm">
            <h2 className="font-display font-extrabold text-base md:text-lg text-espresso mb-4">💭 Motivace</h2>
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

          {/* Zpráva od žadatele */}
          {app.application_message && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-pale shadow-sm">
              <h2 className="font-display font-extrabold text-base md:text-lg text-espresso mb-3">💬 Zpráva od žadatele</h2>
              <p className="text-sm text-brown-mid leading-relaxed bg-amber-light/40 rounded-md p-3">{app.application_message}</p>
            </div>
          )}

          {/* Schůzka — potvrzený termín */}
          {meetingAt && (
            <div className="bg-white rounded-lg p-4 md:p-6 border-2 shadow-sm" style={{ borderColor: '#3B6D11' }}>
              <h2 className="font-display font-extrabold text-base md:text-lg text-espresso mb-3">✅ Potvrzený termín schůzky</h2>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-lg" style={{ background: '#EAF3DE' }}>
                <span className="text-2xl">📅</span>
                <span className="text-base font-extrabold" style={{ color: '#3B6D11' }}>{formatDateTime(meetingAt)}</span>
              </div>
            </div>
          )}

          {/* Schůzka — navrhované termíny (jen pokud ještě není potvrzen) */}
          {meetingOptions.length > 0 && (
            <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-pale shadow-sm">
              <h2 className="font-display font-extrabold text-base md:text-lg text-espresso mb-3">
                {meetingAt ? '📋 Původní návrhy termínů' : '📅 Navrhované termíny schůzky'}
              </h2>
              <div className="space-y-2">
                {meetingOptions.filter(Boolean).map((opt, i) => {
                  const isConfirmed = opt === meetingAt
                  return (
                    <div key={i}
                      className="flex items-center gap-2 text-sm font-semibold px-3 py-2.5 rounded-md"
                      style={{ background: isConfirmed ? '#EAF3DE' : '#FAECE7', color: isConfirmed ? '#3B6D11' : '#993C1D' }}>
                      <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: isConfirmed ? '#3B6D11' : '#E8634A' }}>
                        {isConfirmed ? '✓' : i + 1}
                      </span>
                      {formatDateTime(opt)}
                      {isConfirmed && <span className="ml-auto text-xs font-bold">✅ Potvrzeno žadatelem</span>}
                    </div>
                  )
                })}
              </div>
              {!meetingAt && (
                <p className="text-xs mt-2 font-semibold" style={{ color: '#8B6550' }}>
                  Čeká na potvrzení termínu žadatelem.
                </p>
              )}
            </div>
          )}

          {/* Poznámky */}
          {(app.staff_notes || app.institution_note) && (
            <div className="space-y-3">
              {app.institution_note && (
                <div className="bg-coral-light/40 rounded-lg p-4 border border-coral/20">
                  <div className="text-xs font-bold text-coral-dark uppercase tracking-wider mb-1.5">Zpráva odeslaná žadateli</div>
                  <p className="text-sm text-brown-mid">{app.institution_note}</p>
                </div>
              )}
              {app.staff_notes && (
                <div className="bg-amber-light/50 rounded-lg p-4 border border-amber/20">
                  <div className="text-xs font-bold text-warning uppercase tracking-wider mb-1.5">Interní poznámky</div>
                  <p className="text-sm text-brown-mid">{app.staff_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Pravý panel ── */}
        <div className="space-y-4">

          {/* Zvíře */}
          {animal && (
            <div className="bg-white rounded-lg border border-gray-pale shadow-sm overflow-hidden">
              {animal.primary_photo && (
                <div className="relative h-36 w-full">
                  <Image src={animal.primary_photo} alt={animal.name} fill className="object-cover" />
                </div>
              )}
              <div className="p-4" style={{ background: animal.primary_photo ? undefined : '#FAECE7' }}>
                <div className="text-xs font-bold text-coral-dark uppercase tracking-wider mb-1">Žádost o</div>
                <div className="font-display font-extrabold text-xl text-espresso">
                  {animal.species?.icon} {animal.name}
                </div>
                <div className="text-xs text-gray mt-0.5 font-semibold mb-3">{animal.species?.name_cs}</div>
                <div className="inline-flex items-center px-3 py-1 rounded-pill text-xs font-bold mb-3"
                  style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </div>
                <Link href={`/animals/${animal.id}`} target="_blank" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    Zobrazit profil zvířete ↗
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <ApplicationActions
            applicationId={app.id}
            currentStatus={app.status}
            applicantEmail={app.applicant_email}
            applicantName={app.applicant_name}
            institutionId={app.institution_id}
            confirmedMeetingAt={meetingAt ?? undefined}
          />

          {['reviewing', 'approved', 'meeting_scheduled'].includes(app.status) && (
            <MeetingScheduler
              applicationId={app.id}
              animalName={animal?.name ?? 'zvíře'}
              applicantName={app.applicant_name}
              applicantEmail={app.applicant_email}
              currentMeetingAt={app.meeting_at}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-espresso">{value}</div>
    </div>
  )
}
