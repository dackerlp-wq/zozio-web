import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import type { AdCompany, Ad, AdStatus } from '@/types/database'
import { CompanyActions } from './CompanyActions'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0

const STATUS_LABEL: Record<AdStatus, string> = {
  draft:          'Koncept',
  pending_review: 'Čeká na schválení',
  approved:       'Schválena',
  rejected:       'Zamítnuta',
  paused:         'Pozastavena',
}

const STATUS_STYLE: Record<AdStatus, { color: string; bg: string }> = {
  draft:          { color: '#6B4030', bg: '#F0EDE8' },
  pending_review: { color: '#854F0B', bg: '#FEF9E7' },
  approved:       { color: '#3B6D11', bg: '#EAF3DE' },
  rejected:       { color: '#993C1D', bg: '#FAECE7' },
  paused:         { color: '#8B6550', bg: '#F0EDE8' },
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params
  const service = createServiceClient()

  const [{ data: companyData }, { data: adsData }] = await Promise.all([
    service.from('ad_companies').select('*').eq('id', id).single(),
    service.from('ads').select('*').eq('company_id', id).order('created_at', { ascending: false }),
  ])

  if (!companyData) notFound()

  const company = companyData as AdCompany
  const ads = (adsData ?? []) as Ad[]

  return (
    <div>
      {/* Top bar */}
      <div className="bg-espresso px-8 py-4 flex items-center gap-3 -mx-4 md:-mx-8 -mt-6 md:-mt-8 mb-8">
        <Link href="/superadmin/ads/companies" className="text-xs text-gray-light hover:text-white font-semibold transition-colors">
          ← Firmy
        </Link>
        <span className="text-gray-light/40">·</span>
        <span className="font-display font-bold text-sm text-amber">🏢 {company.company_name}</span>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl mb-1" style={{ color: '#2C1810' }}>
            {company.company_name}
          </h1>
          <div className="flex items-center gap-2">
            {company.approved ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                Schválena
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: '#FEF9E7', color: '#854F0B' }}>
                Čeká na schválení
              </span>
            )}
          </div>
        </div>
        <CompanyActions companyId={company.id} approved={company.approved} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Kontaktní info */}
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base mb-4" style={{ color: '#2C1810' }}>Kontaktní informace</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Firma" value={company.company_name} />
            {company.contact_name && <Row label="Kontaktní osoba" value={company.contact_name} />}
            <Row label="Email" value={company.contact_email} />
            {company.phone && <Row label="Telefon" value={company.phone} />}
            {company.website && (
              <div className="flex gap-3">
                <dt className="text-xs font-bold uppercase tracking-wider shrink-0 w-32 pt-0.5" style={{ color: '#8B6550' }}>Web</dt>
                <dd><a href={company.website} target="_blank" rel="noopener noreferrer"
                  className="font-medium hover:underline" style={{ color: '#E8634A' }}>{company.website}</a></dd>
              </div>
            )}
            <Row label="Registrace" value={new Date(company.created_at).toLocaleDateString('cs-CZ')} />
          </dl>
        </div>

        {/* Fakturační info */}
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base mb-4" style={{ color: '#2C1810' }}>Fakturační údaje</h2>
          <dl className="space-y-3 text-sm">
            {company.ico && <Row label="IČO" value={company.ico} />}
            {company.billing_name && <Row label="Fakturační název" value={company.billing_name} />}
            {company.billing_address && <Row label="Adresa" value={company.billing_address} />}
            {!company.ico && !company.billing_name && !company.billing_address && (
              <p className="text-sm" style={{ color: '#8B6550' }}>Fakturační údaje nejsou vyplněny.</p>
            )}
          </dl>
        </div>
      </div>

      {/* Interní poznámka */}
      <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: '#F0EDE8' }}>
        <h2 className="font-display font-bold text-base mb-4" style={{ color: '#2C1810' }}>Interní poznámka</h2>
        <p className="text-sm mb-1" style={{ color: '#8B6550' }}>
          {company.notes ?? 'Žádná poznámka.'}
        </p>
      </div>

      {/* Reklamy firmy */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#F0EDE8' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base" style={{ color: '#2C1810' }}>
            Reklamy firmy ({ads.length})
          </h2>
        </div>
        {ads.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: '#8B6550' }}>Žádné reklamy.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F0EDE8' }}>
            {ads.map(ad => {
              const s = STATUS_STYLE[ad.status]
              return (
                <div key={ad.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1 truncate" style={{ color: '#2C1810' }}>{ad.headline}</div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: s.bg, color: s.color }}>
                        {STATUS_LABEL[ad.status]}
                      </span>
                      <span className="text-xs" style={{ color: '#8B6550' }}>
                        {ad.active_from} — {ad.active_to}
                      </span>
                    </div>
                  </div>
                  <Link href={`/superadmin/ads/${ad.id}`}
                    className="text-xs font-semibold no-underline hover:underline shrink-0"
                    style={{ color: '#E8634A' }}>
                    Upravit
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="text-xs font-bold uppercase tracking-wider shrink-0 w-32 pt-0.5" style={{ color: '#8B6550' }}>{label}</dt>
      <dd className="font-medium" style={{ color: '#2C1810' }}>{value}</dd>
    </div>
  )
}
