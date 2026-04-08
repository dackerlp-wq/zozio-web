import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { PhotoGallery } from '@/components/public/PhotoGallery'
import { ShareButtons } from '@/components/public/ShareButtons'
import { DonationWidget } from '@/components/public/DonationWidget'
import { StickyPanel } from '@/components/public/StickyPanel'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const c = await getRescueCase(id)
  if (!c) return { title: 'Případ nenalezen | Zozio' }
  const r = c as any
  return {
    title:       `${r.name ?? r.case_number} | Záchranná stanice | Zozio`,
    description: r.public_description?.slice(0, 155) ?? '',
    openGraph:   { images: r.primary_photo ? [{ url: r.primary_photo }] : [] },
  }
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  intake:         { label: '🚑 Příjem',       bg: '#FAECE7', color: '#993C1D' },
  treatment:      { label: '🩺 Léčba',        bg: '#FAEEDA', color: '#854F0B' },
  rehabilitation: { label: '💪 Rehabilitace', bg: '#E1F5EE', color: '#0F6E56' },
  released:       { label: '🌿 Propuštěno',  bg: '#EAF3DE', color: '#3B6D11' },
  transferred:    { label: '🚐 Přemístěno',  bg: '#F0EDE8', color: '#5F5E5A' },
  deceased:       { label: '💔 Uhynulo',      bg: '#F0EDE8', color: '#5F5E5A' },
}

const RESCUE_STEPS = [
  { key: 'intake',         label: 'Příjem',       icon: '🚑', desc: 'Zvíře bylo přijato do záchranné stanice.' },
  { key: 'treatment',      label: 'Léčba',        icon: '🩺', desc: 'Probíhá veterinární léčba a ošetření.' },
  { key: 'rehabilitation', label: 'Rehabilitace', icon: '💪', desc: 'Zvíře se zotavuje a trénuje před propuštěním.' },
  { key: 'released',       label: 'Propuštěno',   icon: '🌿', desc: 'Zvíře bylo úspěšně vráceno do přírody.' },
]

const STEP_ORDER: Record<string, number> = {
  intake: 0, treatment: 1, rehabilitation: 2, released: 3, transferred: 3, deceased: 3,
}

export default async function RescueCaseDetailPage({ params }: PageProps) {
  const { id } = await params
  const rescueCase = await getRescueCase(id)
  if (!rescueCase) notFound()

  const r           = rescueCase as any
  const institution = r.institution as any
  const species     = r.species     as any

  const [fundraiser, similar] = await Promise.all([
    getFundraiser(id),
    getSimilarCases(id, r.institution_id, r.species_id),
  ])

  const currentStep = STEP_ORDER[r.status] ?? 0
  const isReleased  = r.status === 'released'
  const isDeceased  = r.status === 'deceased'
  const shareUrl    = `${BASE}/rescue/${id}`
  const caseName    = r.name ?? r.case_number ?? 'Záchranný případ'
  const status      = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.intake

  const intakeDate = r.intake_date
    ? new Date(r.intake_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const releaseDate = r.release_date
    ? new Date(r.release_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <main className="min-h-screen pt-20 md:pt-24" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 py-5 text-sm flex-wrap">
          <Link href="/" className="no-underline hover:opacity-70 transition-opacity" style={{ color: '#6B4030' }}>Domů</Link>
          <span style={{ color: '#8B6550' }}>·</span>
          <Link href="/rescue" className="no-underline hover:opacity-70 transition-opacity" style={{ color: '#6B4030' }}>Záchranné stanice</Link>
          <span style={{ color: '#8B6550' }}>·</span>
          <span className="font-semibold" style={{ color: '#1A0F0A' }}>{caseName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">

          {/* ── Levý sloupec ── */}
          <div>

            {/* Galerie + share */}
            <div className="mb-6">
              <PhotoGallery
                photos={r.photos ?? []}
                primaryPhoto={r.primary_photo}
                animalName={caseName}
                icon={species?.icon}
              />
              <div className="mt-3">
                <ShareButtons
                  url={shareUrl}
                  title={`${caseName} potřebuje pomoc`}
                  text={r.public_description?.slice(0, 100) ?? ''}
                />
              </div>
            </div>

            {/* Název + status + instituce — mobilní */}
            <div className="lg:hidden mb-6">
              <CaseNameBlock r={r} species={species} status={status} caseName={caseName} />
              {institution && (
                <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-lg border border-[#F0EDE8] bg-white">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#8B6550' }}>
                      Záchranná stanice
                    </div>
                    <div className="font-semibold text-sm text-[#1A0F0A]">{institution.name}</div>
                    {institution.city && <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>📍 {institution.city}</div>}
                  </div>
                  <Link href={`/institutions/${institution.slug}`}
                    className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 flex-shrink-0"
                    style={{ borderColor: '#E0DDD8', color: '#6B4030' }}>
                    Profil →
                  </Link>
                </div>
              )}
            </div>

            {/* Co se stalo */}
            {r.public_description && (
              <section className="mb-7">
                <SectionTitle>Co se stalo</SectionTitle>
                <p className="text-base leading-relaxed" style={{ color: '#4A2C1A', lineHeight: 1.85 }}>
                  {r.public_description}
                </p>
              </section>
            )}

            {/* Info box */}
            <RescueInfoBox r={r} species={species} intakeDate={intakeDate} releaseDate={releaseDate} />

            {/* Průběh léčby — timeline */}
            <section className="mb-7">
              <SectionTitle>Průběh léčby</SectionTitle>

              {isDeceased ? (
                <div className="p-5 rounded-lg text-center"
                  style={{ background: '#F0EDE8', border: '1px solid #E0DDD8' }}>
                  <div className="text-3xl mb-2">💔</div>
                  <p className="font-bold text-[#1A0F0A]">Toto zvíře bohužel nepřežilo.</p>
                  {r.treatment_notes && (
                    <p className="text-sm mt-2" style={{ color: '#8B6550' }}>{r.treatment_notes}</p>
                  )}
                </div>
              ) : r.status === 'transferred' ? (
                <div className="p-5 rounded-lg"
                  style={{ background: '#F0EDE8', border: '1px solid #E0DDD8' }}>
                  <div className="font-bold text-[#1A0F0A] mb-1">🚐 Přemístěno jinam</div>
                  {r.treatment_notes && (
                    <p className="text-sm" style={{ color: '#8B6550' }}>{r.treatment_notes}</p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[23px] top-8 bottom-8 w-0.5" style={{ background: '#E1F5EE' }} />
                  <div className="space-y-0">
                    {RESCUE_STEPS.map((step, idx) => {
                      const isDone   = idx < currentStep
                      const isActive = idx === currentStep
                      const isFuture = idx > currentStep
                      return (
                        <div key={step.key} className="flex items-start gap-4 relative pb-6 last:pb-0">
                          <div className="flex-shrink-0 w-12 flex justify-center pt-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all"
                              style={isActive
                                ? { background: '#2E9E8F', borderColor: '#2E9E8F', boxShadow: '0 0 0 4px rgba(46,158,143,0.15)' }
                                : isDone
                                ? { background: '#EAF3DE', borderColor: '#BDE8D0' }
                                : { background: 'white', borderColor: '#E0DDD8' }
                              }>
                              <span style={{ opacity: isFuture ? 0.35 : 1 }}>{step.icon}</span>
                            </div>
                          </div>
                          <div className={`flex-1 min-w-0 pt-1 ${isFuture ? 'opacity-40' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-base text-[#1A0F0A]">{step.label}</span>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E9E8F] animate-pulse" />
                                  Aktuální stav
                                </span>
                              )}
                              {isDone && <span className="text-sm" style={{ color: '#3B6D11' }}>✓</span>}
                            </div>
                            <p className="text-sm" style={{ color: '#8B6550' }}>
                              {isActive && r.treatment_notes ? r.treatment_notes : step.desc}
                            </p>
                            {step.key === 'intake' && intakeDate && (
                              <p className="text-xs mt-1 font-medium" style={{ color: '#8B6550' }}>📅 {intakeDate}</p>
                            )}
                            {step.key === 'released' && isReleased && releaseDate && (
                              <p className="text-xs mt-1 font-medium" style={{ color: '#3B6D11' }}>📅 {releaseDate}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Úspěšné propuštění */}
            {isReleased && (
              <section className="mb-7">
                <div className="p-6 rounded-lg text-center"
                  style={{ background: 'linear-gradient(135deg, #EAF3DE, #E1F5EE)', border: '1px solid #BDE8D0' }}>
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="font-display font-extrabold text-xl text-[#1A0F0A] mb-2">
                    „{caseName}" se vrátil/a domů!
                  </h3>
                  {releaseDate && (
                    <p className="text-sm" style={{ color: '#3B6D11' }}>
                      Propuštěno {releaseDate}
                      {r.release_location && ` · ${r.release_location}`}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Donační widget — mobilní */}
            {fundraiser && !isDeceased && (
              <div className="lg:hidden mb-7">
                <DonationWidget fundraiser={fundraiser} variant="rescue" />
              </div>
            )}

            {/* CTA bez sbírky — mobilní */}
            {!fundraiser && !isReleased && !isDeceased && institution?.email && (
              <div className="lg:hidden mb-7 bg-white rounded-lg border border-[#F0EDE8] p-5 text-center">
                <div className="text-3xl mb-2">💛</div>
                <p className="text-sm font-semibold text-[#1A0F0A] mb-1">Chceš pomoci?</p>
                <p className="text-xs mb-4" style={{ color: '#8B6550' }}>Kontaktuj záchrannou stanici přímo.</p>
                <a href={`mailto:${institution.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-white no-underline hover:opacity-90"
                  style={{ background: '#2E9E8F' }}>
                  ✉️ Napsat stanici
                </a>
              </div>
            )}

            {/* Podobné případy */}
            {similar.length > 0 && (
              <section className="mb-7">
                <SectionTitle>Další záchranné případy</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {similar.map((s: any) => (
                    <SimilarCaseCard key={s.id} c={s} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Pravý sloupec — sticky ── */}
          <div className="hidden lg:block">
            <StickyPanel>

              {/* Mini progress stepper */}
              {!isDeceased && r.status !== 'transferred' && (
                <div className="px-5 pt-5 pb-4 border-b border-[#F0EDE8]">
                  <MiniStepper currentStep={currentStep} isReleased={isReleased} />
                </div>
              )}

              {/* Název + status */}
              <div className="p-5 border-b border-[#F0EDE8]">
                <CaseNameBlock r={r} species={species} status={status} caseName={caseName} />
              </div>

              {/* Rychlé info */}
              <SidebarQuickInfo r={r} intakeDate={intakeDate} releaseDate={releaseDate} />

              {/* Záchranná stanice */}
              {institution && (
                <div className="px-5 py-4 border-b border-[#F0EDE8]">
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#8B6550' }}>
                    Záchranná stanice
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
                      style={{ background: '#E1F5EE' }}>
                      🚑
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#1A0F0A] truncate">{institution.name}</div>
                      {institution.city && <div className="text-xs mt-0.5" style={{ color: '#8B6550' }}>📍 {institution.city}</div>}
                    </div>
                    <Link href={`/institutions/${institution.slug}`}
                      className="text-xs font-bold no-underline px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 flex-shrink-0"
                      style={{ borderColor: '#E0DDD8', color: '#6B4030' }}>
                      Profil →
                    </Link>
                  </div>
                </div>
              )}

              {/* Propuštění — success */}
              {isReleased && (
                <div className="p-5 border-b border-[#F0EDE8]">
                  <div className="rounded-lg p-4 text-center"
                    style={{ background: 'linear-gradient(135deg, #EAF3DE, #E1F5EE)', border: '1px solid #BDE8D0' }}>
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="font-bold text-sm text-[#1A0F0A] mb-1">Úspěšně propuštěno!</p>
                    {releaseDate && (
                      <p className="text-xs" style={{ color: '#3B6D11' }}>
                        {releaseDate}{r.release_location && ` · ${r.release_location}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Donační widget */}
              {fundraiser && !isDeceased && (
                <div className="p-5 border-b border-[#F0EDE8]">
                  <DonationWidget fundraiser={fundraiser} variant="rescue" />
                </div>
              )}

              {/* CTA — přispět bez sbírky */}
              {!fundraiser && !isReleased && !isDeceased && (
                <div className="p-5">
                  <div className="rounded-lg p-4 text-center" style={{ background: '#F0FBF9', border: '1px solid #C8EBE7' }}>
                    <div className="text-2xl mb-2">💛</div>
                    <p className="text-sm font-bold text-[#1A0F0A] mb-1">Chceš pomoci?</p>
                    <p className="text-xs mb-3" style={{ color: '#8B6550' }}>
                      Záchranné stanice fungují na dobrovolnické bázi. Každá pomoc se počítá.
                    </p>
                    <div className="flex flex-col gap-2">
                      {institution?.email && (
                        <a href={`mailto:${institution.email}`}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-white no-underline hover:opacity-90"
                          style={{ background: '#2E9E8F' }}>
                          ✉️ Napsat stanici
                        </a>
                      )}
                      {institution?.slug && (
                        <Link href={`/institutions/${institution.slug}`}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm no-underline hover:opacity-80 border"
                          style={{ borderColor: '#C8EBE7', color: '#0F6E56' }}>
                          Zobrazit profil stanice →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Deceased */}
              {isDeceased && (
                <div className="p-5">
                  <div className="rounded-lg p-4 text-center" style={{ background: '#F5F3F0', border: '1px solid #E0DDD8' }}>
                    <div className="text-2xl mb-2">💔</div>
                    <p className="text-sm font-bold text-[#1A0F0A] mb-1">Toto zvíře bohužel nepřežilo</p>
                    <p className="text-xs mb-3" style={{ color: '#8B6550' }}>
                      Záchranáři udělali vše, co bylo v jejich silách.
                    </p>
                    {institution?.slug && (
                      <Link href={`/institutions/${institution.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold no-underline hover:opacity-80"
                        style={{ color: '#6B4030' }}>
                        Podpořit záchrannou stanici →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </StickyPanel>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ── Komponenty ── */

function MiniStepper({ currentStep, isReleased }: { currentStep: number; isReleased: boolean }) {
  const steps = [
    { icon: '🚑', label: 'Příjem' },
    { icon: '🩺', label: 'Léčba' },
    { icon: '💪', label: 'Rehab' },
    { icon: '🌿', label: 'Propuštění' },
  ]
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#8B6550' }}>
        Stav léčby
      </p>
      <div className="flex items-center">
        {steps.map((s, i) => {
          const isDone   = i < currentStep || isReleased
          const isActive = i === currentStep && !isReleased
          const isFuture = i > currentStep && !isReleased
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all"
                  style={isActive
                    ? { background: '#2E9E8F', borderColor: '#2E9E8F', boxShadow: '0 0 0 3px rgba(46,158,143,0.2)' }
                    : isDone
                    ? { background: '#EAF3DE', borderColor: '#BDE8D0' }
                    : { background: 'white', borderColor: '#E8E4DF' }
                  }>
                  <span style={{ opacity: isFuture ? 0.3 : 1, fontSize: '14px' }}>{s.icon}</span>
                </div>
                <span className="text-[10px] font-medium text-center leading-tight"
                  style={{ color: isActive ? '#0F6E56' : isDone ? '#3B6D11' : '#B0A090' }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 mb-4"
                  style={{ background: isDone ? '#BDE8D0' : '#EDE8E3' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SidebarQuickInfo({ r, intakeDate, releaseDate }: any) {
  const rows = [
    intakeDate       && { icon: '📅', label: 'Příjem',         value: intakeDate },
    r.found_location && { icon: '📍', label: 'Místo nálezu',   value: r.found_location },
    r.cause_of_injury && { icon: '⚡', label: 'Příčina',        value: r.cause_of_injury },
    r.weight_g       && { icon: '⚖️', label: 'Váha',           value: `${r.weight_g} g` },
    releaseDate      && { icon: '🌿', label: 'Propuštění',      value: releaseDate },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  if (!rows.length) return null

  return (
    <div className="border-b border-[#F0EDE8]">
      {rows.map((row, i) => (
        <div key={row.label}
          className={`flex items-center gap-2.5 px-5 py-2.5 ${i > 0 ? 'border-t border-[#F8F5F2]' : ''}`}>
          <span className="text-sm w-5 text-center flex-shrink-0">{row.icon}</span>
          <span className="text-xs flex-1" style={{ color: '#8B6550' }}>{row.label}</span>
          <span className="text-xs font-semibold text-[#1A0F0A] text-right truncate max-w-[130px]">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold text-lg text-[#1A0F0A] mb-4 pb-3 border-b border-[#F0EDE8]">
      {children}
    </h2>
  )
}

function CaseNameBlock({ r, species, status, caseName }: any) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="font-display font-extrabold text-[#1A0F0A] leading-tight"
          style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
          {caseName}
        </h1>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 mt-1"
          style={{ background: status.bg, color: status.color }}>
          {status.label}
        </span>
      </div>
      <p className="text-sm" style={{ color: '#8B6550' }}>
        {[
          species?.name_cs,
          r.estimated_age,
          r.sex === 'male' ? '♂ Samec' : r.sex === 'female' ? '♀ Samice' : null,
        ].filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}

function RescueInfoBox({ r, species, intakeDate, releaseDate }: any) {
  const rows: { icon: string; label: string; value: string }[] = [
    species?.name_cs    && { icon: '🐾', label: 'Druh',            value: species.name_cs },
    r.estimated_age     && { icon: '🎂', label: 'Odhadovaný věk',  value: r.estimated_age },
    (r.sex === 'male' || r.sex === 'female')
                        && { icon: '⚥',  label: 'Pohlaví',         value: r.sex === 'male' ? '♂ Samec' : '♀ Samice' },
    r.weight_g          && { icon: '⚖️', label: 'Váha při příjmu', value: `${r.weight_g} g` },
    r.cause_of_injury   && { icon: '⚡', label: 'Příčina',          value: r.cause_of_injury },
    r.diagnosis         && { icon: '🔬', label: 'Diagnóza',         value: r.diagnosis },
    r.found_location    && { icon: '📍', label: 'Místo nálezu',     value: r.found_location },
    r.found_by          && { icon: '👤', label: 'Nalezl/a',         value: r.found_by },
    intakeDate          && { icon: '📅', label: 'Datum příjmu',     value: intakeDate },
    releaseDate         && { icon: '🌿', label: 'Datum propuštění', value: releaseDate },
    r.release_location  && { icon: '🗺️', label: 'Místo propuštění', value: r.release_location },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  if (!rows.length) return null

  return (
    <section className="mb-7">
      <SectionTitle>Informace o případu</SectionTitle>
      <div className="rounded-lg border border-[#C8EBE7] overflow-hidden bg-white">
        {rows.map((row, i) => (
          <div key={row.label}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-[#F0FBF9]' : ''}`}>
            <span className="text-base w-6 text-center flex-shrink-0">{row.icon}</span>
            <span className="text-sm flex-1" style={{ color: '#8B6550' }}>{row.label}</span>
            <span className="text-sm font-semibold text-[#1A0F0A] text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SimilarCaseCard({ c }: { c: any }) {
  const species = c.species as any
  const status  = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.intake

  return (
    <Link href={`/rescue/${c.id}`} className="no-underline group">
      <div className="bg-white rounded-lg overflow-hidden border border-[#F0EDE8] hover:border-[#2E9E8F]/40 hover:-translate-y-0.5 transition-all">
        <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
          style={{ background: '#E1F5EE' }}>
          {c.primary_photo
            ? <Image src={c.primary_photo} alt={c.name ?? ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            : <span className="text-4xl">{species?.icon ?? '🐾'}</span>
          }
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: status.bg, color: status.color }}>
            {status.label}
          </div>
        </div>
        <div className="p-3">
          <div className="font-bold text-sm text-[#1A0F0A] truncate group-hover:opacity-80 transition-opacity">
            {c.name ?? c.case_number}
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: '#8B6550' }}>
            {species?.name_cs}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Data ── */

async function getRescueCase(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('*, institution:institutions(id,name,city,type,slug,email,phone), species:animal_species(id,name_cs,icon)')
    .eq('id', id)
    .eq('published', true)
    .single()
  return data
}

async function getFundraiser(rescueCaseId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('fundraisers')
    .select('*')
    .eq('rescue_case_id', rescueCaseId)
    .eq('active', true)
    .single()
  return data ?? null
}

async function getSimilarCases(id: string, institutionId: string, speciesId: string | null) {
  const supabase = createServiceClient()

  // Nejdřív stejný druh ze stejné stanice (max 3)
  let sameSpecies: any[] = []
  if (speciesId) {
    const { data } = await supabase
      .from('rescue_cases')
      .select('id, name, case_number, primary_photo, status, species:animal_species(name_cs,icon)')
      .eq('institution_id', institutionId)
      .eq('species_id', speciesId)
      .eq('published', true)
      .not('status', 'in', '("deceased")')
      .neq('id', id)
      .limit(3)
    sameSpecies = data ?? []
  }

  // Doplň dalšími případy ze stanice
  const remaining = 6 - sameSpecies.length
  const excludeIds = [id, ...sameSpecies.map((c: any) => c.id)]
  const { data: others } = await supabase
    .from('rescue_cases')
    .select('id, name, case_number, primary_photo, status, species:animal_species(name_cs,icon)')
    .eq('institution_id', institutionId)
    .eq('published', true)
    .not('status', 'in', '("deceased")')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(remaining)

  return [...sameSpecies, ...(others ?? [])]
}
