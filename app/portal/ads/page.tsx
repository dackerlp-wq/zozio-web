import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import type { Ad, AdStatus } from '@/types/database'

export const revalidate = 0

const STATUS_LABEL: Record<AdStatus, string> = {
  draft:          'Koncept',
  pending_review: 'Čeká na schválení',
  approved:       'Schválena',
  rejected:       'Zamítnuta',
  paused:         'Pozastavena',
}

const STATUS_STYLE: Record<AdStatus, { bg: string; color: string }> = {
  draft:          { bg: '#F0EDE8', color: '#6B4030' },
  pending_review: { bg: '#FEF9E7', color: '#854F0B' },
  approved:       { bg: '#EAF3DE', color: '#3B6D11' },
  rejected:       { bg: '#FAECE7', color: '#993C1D' },
  paused:         { bg: '#F0EDE8', color: '#8B6550' },
}

function StatusBadge({ status, ad }: { status: AdStatus; ad: Ad }) {
  const today = new Date().toISOString().split('T')[0]
  let label = STATUS_LABEL[status]
  let style = STATUS_STYLE[status]

  // Schválená, ale expirovaná
  if (status === 'approved' && ad.active_to < today) {
    label = 'Expirovaná'
    style = { bg: '#FAECE7', color: '#993C1D' }
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  )
}

export default async function PortalAdsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: company } = await supabase
    .from('ad_companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) {
    return (
      <div>
        <h1 className="font-display font-extrabold text-3xl mb-6" style={{ color: '#1A0F0A' }}>
          Moje reklamy
        </h1>
        <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: '#F0EDE8' }}>
          <p className="text-sm mb-4" style={{ color: '#8B6550' }}>
            Pro vytváření reklam je potřeba nejdřív vyplnit profil firmy.
          </p>
          <Link href="/portal/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white no-underline"
            style={{ background: '#E8634A' }}>
            Vyplnit profil →
          </Link>
        </div>
      </div>
    )
  }

  const service = createServiceClient()
  const { data } = await service
    .from('ads')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const ads = (data ?? []) as Ad[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-3xl" style={{ color: '#1A0F0A' }}>
          Moje reklamy
        </h1>
        <Link href="/portal/ads/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white no-underline transition-all hover:opacity-90"
          style={{ background: '#E8634A' }}>
          + Nová reklama
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: '#F0EDE8' }}>
          <div className="text-4xl mb-4">📣</div>
          <h2 className="font-display font-bold text-xl mb-3" style={{ color: '#1A0F0A' }}>
            Zatím žádné reklamy
          </h2>
          <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
            Vytvořte svou první reklamu a oslovte tisíce milovníků zvířat.
          </p>
          <Link href="/portal/ads/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white no-underline transition-all hover:opacity-90"
            style={{ background: '#E8634A' }}>
            Vytvořit první reklamu →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}
    </div>
  )
}

function AdCard({ ad }: { ad: Ad }) {
  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'
  const canEdit = ad.status === 'draft' || ad.status === 'rejected'
  const canSubmit = ad.status === 'draft'

  return (
    <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#F0EDE8' }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-base mb-1 truncate" style={{ color: '#1A0F0A' }}>
            {ad.headline}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={ad.status} ad={ad} />
            {ad.slots.map(slot => (
              <span key={slot} className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: '#F0EDE8', color: '#6B4030' }}>
                {slot}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <Link href={`/portal/ads/${ad.id}`}
              className="px-3 py-1.5 rounded-lg text-xs font-bold no-underline transition-all hover:opacity-90"
              style={{ background: '#F0EDE8', color: '#E8634A' }}>
              Upravit
            </Link>
          )}
          {!canEdit && (
            <Link href={`/portal/ads/${ad.id}`}
              className="px-3 py-1.5 rounded-lg text-xs font-bold no-underline transition-all hover:opacity-80"
              style={{ background: '#F0EDE8', color: '#6B4030' }}>
              Detail
            </Link>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {ad.status === 'rejected' && ad.rejection_reason && (
        <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: '#FAECE7', color: '#993C1D' }}>
          <strong>Důvod zamítnutí:</strong> {ad.rejection_reason}
        </div>
      )}

      <div className="flex items-center gap-6 pt-3 border-t" style={{ borderColor: '#F0EDE8' }}>
        <Stat label="Zobrazení" value={ad.impressions.toLocaleString('cs-CZ')} />
        <Stat label="Kliky" value={ad.clicks.toLocaleString('cs-CZ')} />
        <Stat label="CTR" value={`${ctr}%`} />
        <div className="text-xs ml-auto" style={{ color: '#8B6550' }}>
          {ad.active_from} — {ad.active_to}
        </div>
        {canSubmit && (
          <SubmitButton adId={ad.id} />
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-bold text-sm" style={{ color: '#1A0F0A' }}>{value}</div>
      <div className="text-xs" style={{ color: '#8B6550' }}>{label}</div>
    </div>
  )
}

// Client component for submit action
import { SubmitAdButton } from './SubmitAdButton'

function SubmitButton({ adId }: { adId: string }) {
  return <SubmitAdButton adId={adId} />
}
