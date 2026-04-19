import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import type { Ad, AdTier } from '@/types/database'

export const revalidate = 0

const TIER_LABEL: Record<AdTier, string> = {
  main:      'Hlavní partner',
  partner:   'Partner',
  supporter: 'Supporter',
  friend:    'Friend',
}

const TIER_STYLE: Record<AdTier, { color: string; bg: string }> = {
  main:      { color: '#F0A500', bg: '#FEF9E7' },
  partner:   { color: '#E8634A', bg: '#FAECE7' },
  supporter: { color: '#3B6D11', bg: '#EAF3DE' },
  friend:    { color: '#6B4030', bg: '#F0EDE8' },
}

const SLOT_LABEL: Record<string, string> = {
  inline_grid:   'Grid',
  sidebar:       'Sidebar',
  banner_adopt:  'Banner adopce',
  banner_home:   'Banner HP',
  banner_animal: 'Banner zvíře',
  newsletter:    'Newsletter',
}

function TierBadge({ tier }: { tier: AdTier }) {
  const s = TIER_STYLE[tier] ?? TIER_STYLE.friend
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ color: s.color, background: s.bg }}>
      {TIER_LABEL[tier]}
    </span>
  )
}

function AdStatus({ ad }: { ad: Ad }) {
  const today = new Date().toISOString().split('T')[0]
  if (!ad.active) return <span className="text-xs font-semibold text-gray-400">Neaktivní</span>
  if (ad.active_to < today) return <span className="text-xs font-semibold text-red-500">Expirovaná</span>
  if (ad.active_from > today) return <span className="text-xs font-semibold text-amber-500">Připravovaná</span>
  return <span className="text-xs font-semibold text-green-600">Aktivní</span>
}

export default async function SuperadminAdsPage() {
  const service = createServiceClient()

  const { data } = await service
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false })

  const ads = (data ?? []) as Ad[]

  const today = new Date().toISOString().split('T')[0]
  const activeAds = ads.filter(a => a.active && a.active_from <= today && a.active_to >= today)
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions ?? 0), 0)
  const totalClicks = ads.reduce((s, a) => s + (a.clicks ?? 0), 0)
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'

  return (
    <div>
      {/* Top bar */}
      <div className="bg-espresso px-8 py-4 flex items-center justify-between -mx-4 md:-mx-8 -mt-6 md:-mt-8 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/superadmin" className="text-xs text-gray-light hover:text-white font-semibold transition-colors">
            ← Superadmin
          </Link>
          <span className="text-gray-light/40">·</span>
          <span className="font-display font-bold text-sm text-amber">📣 Reklamy</span>
        </div>
        <Link href="/superadmin/ads/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white no-underline transition-all hover:opacity-90"
          style={{ background: '#E8634A' }}>
          + Přidat reklamu
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-display font-extrabold text-3xl mb-1" style={{ color: '#2C1810' }}>
          Reklamní systém
        </h1>
        <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
          Správa inzerce a sponzorů platformy Zozio
        </p>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Aktivní reklamy" value={activeAds.length} icon="📣" />
        <StatCard label="Celkem zobrazení" value={totalImpressions.toLocaleString('cs-CZ')} icon="👁️" />
        <StatCard label="Celkem kliků" value={totalClicks.toLocaleString('cs-CZ')} icon="🖱️" />
        <StatCard label="Průměrné CTR" value={`${avgCtr}%`} icon="📊" />
      </div>

      {/* Tabulka */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#F0EDE8' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base" style={{ color: '#2C1810' }}>
            Všechny reklamy ({ads.length})
          </h2>
        </div>

        {ads.length === 0 ? (
          <div className="py-16 text-center text-sm font-medium" style={{ color: '#8B6550' }}>
            Zatím žádné reklamy. <Link href="/superadmin/ads/new" className="font-bold" style={{ color: '#E8634A' }}>Přidat první →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: '#F0EDE8', background: '#FFFCF8' }}>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Firma</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Tier</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Sloty</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Období</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-right" style={{ color: '#8B6550' }}>Zobrazení</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-right" style={{ color: '#8B6550' }}>Kliky</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-right" style={{ color: '#8B6550' }}>CTR%</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Stav</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F0EDE8' }}>
                {ads.map((ad) => {
                  const ctr = ad.impressions > 0
                    ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
                    : '0.00'
                  return (
                    <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold" style={{ color: '#2C1810' }}>{ad.company_name}</div>
                        <div className="text-xs truncate max-w-[180px]" style={{ color: '#8B6550' }}>{ad.headline}</div>
                      </td>
                      <td className="px-3 py-3">
                        <TierBadge tier={ad.tier} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {ad.slots.map(slot => (
                            <span key={slot} className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{ background: '#F0EDE8', color: '#6B4030' }}>
                              {SLOT_LABEL[slot] ?? slot}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: '#8B6550' }}>
                        {ad.active_from} — {ad.active_to}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: '#2C1810' }}>
                        {ad.impressions.toLocaleString('cs-CZ')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: '#2C1810' }}>
                        {ad.clicks.toLocaleString('cs-CZ')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono" style={{ color: '#8B6550' }}>
                        {ctr}%
                      </td>
                      <td className="px-3 py-3">
                        <AdStatus ad={ad} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/superadmin/ads/${ad.id}`}
                            className="text-xs font-semibold no-underline hover:underline"
                            style={{ color: '#E8634A' }}>
                            Upravit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border shadow-sm" style={{ borderColor: '#F0EDE8' }}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-display font-extrabold text-2xl mb-0.5" style={{ color: '#E8634A' }}>
        {value}
      </div>
      <div className="text-xs font-semibold" style={{ color: '#8B6550' }}>{label}</div>
    </div>
  )
}
