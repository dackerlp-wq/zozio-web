import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import type { Ad, AdStatus } from '@/types/database'
import { PrintButton } from './PrintButton'
import { calcAdTotal, SLOT_LABELS } from '@/lib/ad-pricing'

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


function StatusBadge({ status }: { status: AdStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.color }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: company } = await supabase
    .from('ad_companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) {
    return (
      <div>
        <h1 className="font-display font-extrabold text-3xl mb-6" style={{ color: '#1A0F0A' }}>
          Vítejte v Zozio portálu
        </h1>
        <div className="bg-white rounded-xl border p-8 text-center max-w-lg" style={{ borderColor: '#F0EDE8' }}>
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="font-display font-bold text-xl mb-3" style={{ color: '#1A0F0A' }}>
            Nejdřív vyplňte profil firmy
          </h2>
          <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
            Před vytvořením reklam je potřeba vyplnit základní informace o vaší firmě.
          </p>
          <Link href="/portal/settings"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white no-underline transition-all hover:opacity-90"
            style={{ background: '#E8634A' }}>
            Vyplnit profil firmy →
          </Link>
        </div>
      </div>
    )
  }

  if (!company.approved) {
    return (
      <div>
        <h1 className="font-display font-extrabold text-3xl mb-6" style={{ color: '#1A0F0A' }}>Dashboard</h1>
        <div className="rounded-xl border p-6 mb-6" style={{ borderColor: '#FDE68A', background: '#FEF9E7' }}>
          <div className="flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <div>
              <p className="font-bold text-sm mb-1" style={{ color: '#854F0B' }}>Váš účet čeká na schválení</p>
              <p className="text-sm" style={{ color: '#854F0B' }}>
                Tým Zozio zkontroluje vaši firmu a budeme vás kontaktovat na{' '}
                <strong>{company.contact_email}</strong>.
              </p>
            </div>
          </div>
        </div>
        <div className="text-center py-8 text-sm" style={{ color: '#8B6550' }}>
          Po schválení zde uvidíte vaše statistiky a reklamy.
        </div>
      </div>
    )
  }

  // Načtení reklam
  const service = createServiceClient()
  const { data: ads } = await service
    .from('ads')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const allAds = (ads ?? []) as Ad[]
  const today = new Date().toISOString().split('T')[0]

  const activeAds   = allAds.filter(a => a.active && a.status === 'approved' && a.active_from <= today && a.active_to >= today)
  const expiringAds = allAds.filter(a => {
    if (a.status !== 'approved') return false
    const daysLeft = Math.round((new Date(a.active_to).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft >= 0 && daysLeft <= 14
  })

  const totalImpressions = allAds.reduce((s, a) => s + (a.impressions ?? 0), 0)
  const totalClicks      = allAds.reduce((s, a) => s + (a.clicks ?? 0), 0)
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'

  // Celkový odhadovaný spend (pouze schválené reklamy)
  const approvedAds = allAds.filter(a => a.status === 'approved' || a.status === 'paused')
  const totalSpend  = approvedAds.reduce((s, a) => s + calcAdTotal(a), 0)

  // Denní statistiky posledních 30 dní
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const adIds = allAds.map(a => a.id)

  interface DailyStat { ad_id: string; day: string; impressions: number; clicks: number }
  let dailyStats: { day: string; impressions: number; clicks: number }[] = []

  if (adIds.length > 0) {
    const { data: rawStats } = await service
      .from('ad_daily_stats')
      .select('ad_id, day, impressions, clicks')
      .in('ad_id', adIds)
      .gte('day', thirtyDaysAgo.toISOString().split('T')[0])
      .order('day', { ascending: false })

    const byDay: Record<string, { impressions: number; clicks: number }> = {}
    for (const row of (rawStats ?? []) as DailyStat[]) {
      if (!byDay[row.day]) byDay[row.day] = { impressions: 0, clicks: 0 }
      byDay[row.day].impressions += row.impressions ?? 0
      byDay[row.day].clicks      += row.clicks ?? 0
    }
    dailyStats = Object.entries(byDay)
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => b.day.localeCompare(a.day))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold text-3xl" style={{ color: '#1A0F0A' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#8B6550' }}>{company.company_name}</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <PrintButton />
          <Link href="/portal/ads/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white no-underline transition-all hover:opacity-90"
            style={{ background: '#E8634A' }}>
            + Nová reklama
          </Link>
        </div>
      </div>

      {/* Výstraha — expirující reklamy */}
      {expiringAds.length > 0 && (
        <div className="mb-6 px-4 py-3 rounded-xl border flex items-start gap-3"
          style={{ background: '#FEF9E7', borderColor: '#FDE68A' }}>
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-sm mb-1" style={{ color: '#854F0B' }}>
              {expiringAds.length === 1 ? 'Reklama brzy expiruje' : `${expiringAds.length} reklamy brzy expirují`}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {expiringAds.map(a => {
                const daysLeft = Math.round((new Date(a.active_to).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <Link key={a.id} href={`/portal/ads/${a.id}`}
                    className="text-xs font-semibold no-underline hover:underline"
                    style={{ color: '#854F0B' }}>
                    {a.headline} ({daysLeft === 0 ? 'dnes' : `za ${daysLeft} dní`})
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Velká čísla */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Celkem zobrazení" value={totalImpressions.toLocaleString('cs-CZ')} icon="👁️" />
        <StatCard label="Celkem kliků"     value={totalClicks.toLocaleString('cs-CZ')}      icon="🖱️" />
        <StatCard label="Průměrný CTR"     value={`${ctr} %`}                               icon="📊" />
        <StatCard label="Aktivní kampaně"  value={activeAds.length}                          icon="📣" />
      </div>

      {/* Spend summary */}
      {approvedAds.length > 0 && (
        <div className="bg-white rounded-xl border mb-8 overflow-hidden" style={{ borderColor: '#F0EDE8' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#F0EDE8' }}>
            <h2 className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>
              Přehled výdajů
            </h2>
            <span className="text-xs" style={{ color: '#8B6550' }}>Orientační ceny vč. DPH</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#FFFCF8' }}>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Kampaň</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Plochy</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Období</th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Cena vč. DPH</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F0EDE8' }}>
                {approvedAds.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/portal/ads/${ad.id}`} className="font-semibold no-underline hover:underline" style={{ color: '#1A0F0A' }}>
                        {ad.headline}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#8B6550' }}>
                      {ad.slots.map(s => SLOT_LABELS[s] ?? s).join(', ')}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: '#8B6550' }}>
                      {ad.active_from} — {ad.active_to}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold" style={{ color: '#E8634A' }}>
                      {calcAdTotal(ad).toLocaleString('cs-CZ')} Kč
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#FFFCF8', borderTop: '2px solid #F0EDE8' }}>
                  <td colSpan={3} className="px-5 py-3 font-bold text-sm" style={{ color: '#1A0F0A' }}>
                    Celkem (orientačně)
                  </td>
                  <td className="px-3 py-3 text-right font-display font-extrabold text-base" style={{ color: '#E8634A' }}>
                    {totalSpend.toLocaleString('cs-CZ')} Kč
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Denní statistiky */}
      {dailyStats.length > 0 && (
        <div className="bg-white rounded-xl border mb-8" style={{ borderColor: '#F0EDE8' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
            <h2 className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>
              Statistiky — posledních 30 dní
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#FFFCF8' }}>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Datum</th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Zobrazení</th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Kliky</th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>CTR%</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F0EDE8' }}>
                {dailyStats.map(row => (
                  <tr key={row.day} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-medium" style={{ color: '#1A0F0A' }}>{row.day}</td>
                    <td className="px-3 py-2.5 text-right font-mono" style={{ color: '#1A0F0A' }}>{row.impressions.toLocaleString('cs-CZ')}</td>
                    <td className="px-3 py-2.5 text-right font-mono" style={{ color: '#1A0F0A' }}>{row.clicks.toLocaleString('cs-CZ')}</td>
                    <td className="px-3 py-2.5 text-right font-mono" style={{ color: '#8B6550' }}>
                      {row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : '0.00'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabulka reklam */}
      <div className="bg-white rounded-xl border" style={{ borderColor: '#F0EDE8' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>
            Vaše reklamy ({allAds.length})
          </h2>
          <Link href="/portal/ads" className="text-sm font-semibold no-underline" style={{ color: '#E8634A' }}>
            Všechny →
          </Link>
        </div>

        {allAds.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: '#8B6550' }}>
            Zatím nemáte žádné reklamy.{' '}
            <Link href="/portal/ads/new" className="font-bold" style={{ color: '#E8634A' }}>Vytvořit první →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#FFFCF8' }}>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Název</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Stav</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Období</th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Zobrazení</th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Kliky</th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>CTR%</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F0EDE8' }}>
                {allAds.map(ad => {
                  const adCtr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'
                  const isExpired = ad.status === 'approved' && ad.active_to < today
                  return (
                    <tr key={ad.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/portal/ads/${ad.id}`} className="font-semibold no-underline hover:underline" style={{ color: '#1A0F0A' }}>
                          {ad.headline}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {isExpired
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#FAECE7', color: '#993C1D' }}>Expirovaná</span>
                          : <StatusBadge status={ad.status} />
                        }
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: '#8B6550' }}>
                        {ad.active_from} — {ad.active_to}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: '#1A0F0A' }}>
                        {ad.impressions.toLocaleString('cs-CZ')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: '#1A0F0A' }}>
                        {ad.clicks.toLocaleString('cs-CZ')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono" style={{ color: '#8B6550' }}>{adCtr}%</td>
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
    <div className="bg-white rounded-xl p-5 border" style={{ borderColor: '#F0EDE8' }}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-display font-extrabold text-2xl mb-0.5" style={{ color: '#E8634A' }}>{value}</div>
      <div className="text-xs font-semibold" style={{ color: '#8B6550' }}>{label}</div>
    </div>
  )
}
