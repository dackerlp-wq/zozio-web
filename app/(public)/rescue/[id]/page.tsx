import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { FundraiserBar } from '@/components/public/FundraiserBar'
import type { RescueCase } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const c = await getRescueCase(id)
  if (!c) return { title: 'Případ nenalezen | Zozio' }
  return {
    title: `${c.name ?? c.case_number} — Záchranná stanice | Zozio`,
    description: c.public_description?.slice(0, 155) ?? `Záchranný případ ze stanice ${c.institution?.name}.`,
  }
}

export default async function RescueCaseDetailPage({ params }: PageProps) {
  const { id } = await params
  const c = await getRescueCase(id)
  if (!c) notFound()

  const fundraiser = await getFundraiser(id)

  const statusLabel: Record<string, string> = {
    intake:         '🚑 Příjem',
    treatment:      '🩺 V léčbě',
    rehabilitation: '💪 Rehabilitace',
    released:       '✓ Propuštěn do přírody',
    transferred:    '🚐 Přemístěn',
    deceased:       'Uhynul',
  }

  const intakeDate = c.intake_date
    ? new Date(c.intake_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const releaseDate = c.release_date
    ? new Date(c.release_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <main className="min-h-screen bg-warm pt-24 pb-20">
      <div className="max-w-[1100px] mx-auto px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray mb-8 font-semibold">
          <Link href="/" className="hover:text-rescue transition-colors">Domů</Link>
          <span>·</span>
          <Link href="/rescue" className="hover:text-rescue transition-colors">Záchranné stanice</Link>
          <span>·</span>
          <span className="text-espresso">{c.name ?? c.case_number}</span>
        </nav>

        <div className="grid grid-cols-2 gap-12 items-start">

          {/* Levá strana */}
          <div>
            <div className="relative w-full h-[420px] rounded-lg overflow-hidden bg-gradient-to-br from-rescue-bg to-rescue-light/40 flex items-center justify-center text-[120px] mb-4">
              {c.primary_photo ? (
                <Image src={c.primary_photo} alt={c.name ?? 'Záchranný případ'} fill className="object-cover" />
              ) : (
                <span>{c.species?.icon ?? '🐾'}</span>
              )}
            </div>

            {/* Galerie */}
            {c.photos.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {c.photos.slice(0, 5).map((photo, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden bg-rescue-bg">
                    <Image src={photo} alt={`Foto ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Záchranná stanice */}
            {c.institution && (
              <div className="bg-rescue-bg rounded-md px-4 py-3 mt-4 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-sm text-rescue-dark">
                    🚑 {c.institution.name}
                  </div>
                  <div className="text-xs text-gray mt-0.5">📍 {c.institution.city}</div>
                </div>
                <Link href={`/institutions/${c.institution.slug}`}>
                  <Button variant="ghost-rescue" size="sm">Profil stanice</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Pravá strana */}
          <div>
            {/* Název a stav */}
            <div className="flex items-start justify-between mb-2">
              <h1 className="font-display font-extrabold text-5xl text-espresso">
                {c.name ?? c.case_number}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill font-body text-xs font-bold bg-rescue-bg text-rescue-dark">
                {statusLabel[c.status] ?? c.status}
              </span>
              {c.species && <Tag label={c.species.name_cs} variant="rescue" />}
              {c.estimated_age && <Tag label={c.estimated_age} variant="sand" />}
              {c.sex === 'male' && <Tag label="♂ Samec" variant="sand" />}
              {c.sex === 'female' && <Tag label="♀ Samice" variant="sand" />}
            </div>

            {/* Timeline */}
            <div className="bg-sand rounded-md p-4 mb-5 space-y-2">
              {intakeDate && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-rescue font-bold">📅 Příjem:</span>
                  <span className="text-brown-mid">{intakeDate}</span>
                </div>
              )}
              {c.found_location && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-rescue font-bold">📍 Naleziště:</span>
                  <span className="text-brown-mid">{c.found_location}</span>
                </div>
              )}
              {c.found_by && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-rescue font-bold">👤 Nalezl/a:</span>
                  <span className="text-brown-mid">{c.found_by}</span>
                </div>
              )}
              {releaseDate && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-rescue font-bold">🌿 Propuštěn:</span>
                  <span className="text-brown-mid font-bold">{releaseDate}</span>
                </div>
              )}
            </div>

            {/* Příčina + diagnóza */}
            {c.cause_of_injury && (
              <div className="mb-3">
                <span className="text-xs font-bold text-brown uppercase tracking-wider">Příčina</span>
                <p className="text-sm text-brown-mid mt-1">{c.cause_of_injury}</p>
              </div>
            )}
            {c.diagnosis && (
              <div className="mb-3">
                <span className="text-xs font-bold text-brown uppercase tracking-wider">Diagnóza</span>
                <p className="text-sm text-brown-mid mt-1">{c.diagnosis}</p>
              </div>
            )}

            {/* Veřejný popis */}
            {c.public_description && (
              <p className="text-base text-brown-mid leading-relaxed mb-5">
                {c.public_description}
              </p>
            )}

            {/* Průběh léčby */}
            {c.treatment_notes && (
              <div className="bg-rescue-bg rounded-md p-4 mb-5">
                <span className="text-xs font-bold text-rescue-dark uppercase tracking-wider block mb-2">
                  🩺 Průběh léčby
                </span>
                <p className="text-sm text-brown-mid leading-relaxed">{c.treatment_notes}</p>
              </div>
            )}

            {/* Sbírka */}
            {fundraiser && (
              <FundraiserBar fundraiser={fundraiser} variant="rescue" />
            )}

            {/* Propuštěn úspěch */}
            {c.status === 'released' && (
              <div className="bg-success-bg rounded-lg p-5 text-center mt-4">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-display font-extrabold text-xl text-success">
                  {c.name ?? 'Toto zvíře'} se vrátilo do přírody!
                </p>
                {releaseDate && (
                  <p className="text-sm text-gray mt-1">Propuštěno {releaseDate}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

async function getRescueCase(id: string): Promise<RescueCase | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rescue_cases')
    .select(`
      *,
      institution:institutions(id, name, city, type, slug, email, phone),
      species:animal_species(id, name_cs, icon)
    `)
    .eq('id', id)
    .eq('published', true)
    .single()

  if (error || !data) return null
  return data as RescueCase
}

async function getFundraiser(rescueCaseId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fundraisers')
    .select('*')
    .eq('rescue_case_id', rescueCaseId)
    .eq('active', true)
    .single()
  return data ?? null
}
