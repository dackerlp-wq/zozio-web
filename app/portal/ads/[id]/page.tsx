import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PortalAdForm } from '../PortalAdForm'
import { SubmitAdButton } from '../SubmitAdButton'
import type { Ad, AdStatus } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0

const STATUS_LABEL: Record<AdStatus, string> = {
  draft:          'Koncept',
  pending_review: 'Čeká na schválení',
  approved:       'Aktivní',
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

const SLOT_LABEL: Record<string, string> = {
  inline_grid:   'V gridu zvířat',
  sidebar:       'Postranní panel',
  banner_adopt:  'Banner — Adopce',
  banner_home:   'Banner — Domů',
  banner_animal: 'Banner — Zvíře',
  newsletter:    'Newsletter',
}

export default async function AdDetailPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const service = createServiceClient()
  const { data, error } = await service.from('ads').select('*').eq('id', id).single()
  if (error || !data) notFound()

  const ad = data as Ad

  // Ověř vlastnictví
  const { data: company } = await supabase
    .from('ad_companies').select('id').eq('user_id', user.id).single()
  if (!company || ad.company_id !== company.id) notFound()

  const today = new Date().toISOString().split('T')[0]
  const isExpired = ad.status === 'approved' && ad.active_to < today
  const canEdit   = ad.status === 'draft' || ad.status === 'rejected'
  const canSubmit = ad.status === 'draft'
  const ctr       = ad.impressions > 0
    ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
    : '0.00'

  // Denní statistiky posledních 30 dní pro tuto reklamu
  interface DailyStat { ad_id: string; day: string; impressions: number; clicks: number }
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: rawDaily } = await service
    .from('ad_daily_stats')
    .select('ad_id, day, impressions, clicks')
    .eq('ad_id', id)
    .gte('day', thirtyDaysAgo.toISOString().split('T')[0])
    .order('day', { ascending: true })

  const dailyStats = (rawDaily ?? []) as DailyStat[]
  const maxImpressions = Math.max(...dailyStats.map(d => d.impressions), 1)

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/portal/ads" className="no-underline font-semibold hover:opacity-70" style={{ color: '#8B6550' }}>
          ← Moje reklamy
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl mb-2" style={{ color: '#1A0F0A' }}>
            {ad.headline}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
              style={isExpired
                ? { background: '#FAECE7', color: '#993C1D' }
                : { background: STATUS_STYLE[ad.status].bg, color: STATUS_STYLE[ad.status].color }}>
              {isExpired ? 'Expirovaná' : STATUS_LABEL[ad.status]}
            </span>
            {ad.slots.map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: '#F0EDE8', color: '#6B4030' }}>
                {SLOT_LABEL[s] ?? s}
              </span>
            ))}
          </div>
        </div>
        {canSubmit && <SubmitAdButton adId={ad.id} />}
      </div>

      {/* Zamítnutí */}
      {ad.status === 'rejected' && ad.rejection_reason && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: '#FAECE7', border: '1px solid #F5C4B3', color: '#993C1D' }}>
          <strong>Důvod zamítnutí:</strong> {ad.rejection_reason}
          <p className="mt-1 text-xs">Upravte reklamu a odešlete znovu ke schválení.</p>
        </div>
      )}

      {/* ── Statistiky ── */}
      <div className="bg-white rounded-xl border mb-6" style={{ borderColor: '#F0EDE8' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>Výsledky kampaně</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8B6550' }}>
            {ad.active_from} — {ad.active_to}
          </p>
        </div>

        {/* Velká čísla */}
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: '#F0EDE8' }}>
          <StatBox label="Zobrazení" value={ad.impressions.toLocaleString('cs-CZ')} sub="celkem" icon="👁️" />
          <StatBox label="Kliky" value={ad.clicks.toLocaleString('cs-CZ')} sub="celkem" icon="🖱️" />
          <StatBox label="CTR" value={`${ctr}%`} sub="průměr" icon="📊"
            highlight={parseFloat(ctr) >= 1} />
        </div>

        {/* Graf zobrazení — posledních 30 dní */}
        {dailyStats.length > 0 ? (
          <div className="px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#8B6550' }}>
              Zobrazení za posledních 30 dní
            </p>

            {/* Bar chart — CSS only */}
            <div className="flex items-end gap-0.5 h-24 mb-1">
              {dailyStats.map(d => {
                const height = Math.max((d.impressions / maxImpressions) * 100, 2)
                const hasClicks = d.clicks > 0
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end group relative"
                    title={`${d.day}\n${d.impressions} zobrazení · ${d.clicks} kliků`}>
                    <div
                      className="w-full rounded-t-sm transition-opacity group-hover:opacity-75"
                      style={{
                        height: `${height}%`,
                        background: hasClicks ? '#E8634A' : '#F0EDE8',
                        minHeight: '2px',
                      }}
                    />
                    {/* Tooltip při hover */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="bg-[#2C1810] text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg">
                        {new Date(d.day).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                        <br />
                        {d.impressions} zobr. · {d.clicks} kl.
                      </div>
                      <div className="w-1.5 h-1.5 bg-[#2C1810] rotate-45 -mt-0.5" />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legenda os X — jen první, střed a poslední datum */}
            <div className="flex justify-between text-[10px]" style={{ color: '#A89080' }}>
              <span>{new Date(dailyStats[0].day).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#F0EDE8' }} />
                  Zobrazení
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#E8634A' }} />
                  S kliky
                </span>
              </span>
              <span>{new Date(dailyStats[dailyStats.length - 1].day).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}</span>
            </div>

            {/* Denní tabulka */}
            <div className="mt-5 border-t pt-4" style={{ borderColor: '#F0EDE8' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#8B6550' }}>
                Denní přehled
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-bold py-1.5" style={{ color: '#8B6550' }}>Datum</th>
                      <th className="text-right text-xs font-bold py-1.5" style={{ color: '#8B6550' }}>Zobrazení</th>
                      <th className="text-right text-xs font-bold py-1.5" style={{ color: '#8B6550' }}>Kliky</th>
                      <th className="text-right text-xs font-bold py-1.5" style={{ color: '#8B6550' }}>CTR%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...dailyStats].reverse().map(row => (
                      <tr key={row.day} className="border-t" style={{ borderColor: '#F0EDE8' }}>
                        <td className="py-2 text-xs" style={{ color: '#1A0F0A' }}>
                          {new Date(row.day).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-2 text-right font-mono text-xs font-semibold" style={{ color: '#1A0F0A' }}>
                          {row.impressions.toLocaleString('cs-CZ')}
                        </td>
                        <td className="py-2 text-right font-mono text-xs font-semibold" style={{ color: '#1A0F0A' }}>
                          {row.clicks.toLocaleString('cs-CZ')}
                        </td>
                        <td className="py-2 text-right font-mono text-xs" style={{ color: '#8B6550' }}>
                          {row.impressions > 0
                            ? ((row.clicks / row.impressions) * 100).toFixed(2)
                            : '0.00'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#1A0F0A' }}>
              {ad.status === 'draft' || ad.status === 'pending_review'
                ? 'Reklama ještě nebyla spuštěna'
                : 'Zatím žádná data'}
            </p>
            <p className="text-xs" style={{ color: '#8B6550' }}>
              {ad.status === 'draft'
                ? 'Odešlete reklamu ke schválení — po spuštění se zde zobrazí statistiky.'
                : ad.status === 'pending_review'
                ? 'Čekáme na schválení. Statistiky se začnou zobrazovat po spuštění kampaně.'
                : 'Data se zobrazí jakmile reklama zaznamená první zobrazení.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Info o kampani ── */}
      <div className="bg-white rounded-xl border mb-6" style={{ borderColor: '#F0EDE8' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>Detail kampaně</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoRow label="Headline" value={ad.headline} />
          <InfoRow label="Popis" value={ad.description ?? '—'} />
          <InfoRow label="CTA tlačítko" value={ad.cta_label} />
          <InfoRow label="Cílová URL" value={ad.cta_url} link />
          <InfoRow label="Období" value={`${ad.active_from} — ${ad.active_to}`} />
          <InfoRow label="Plochy" value={ad.slots.map(s => SLOT_LABEL[s] ?? s).join(', ')} />
        </div>
      </div>

      {/* ── Formulář (jen draft/rejected) ── */}
      {canEdit && (
        <div className="bg-white rounded-xl border" style={{ borderColor: '#F0EDE8' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
            <h2 className="font-display font-bold text-base" style={{ color: '#1A0F0A' }}>Upravit reklamu</h2>
          </div>
          <div className="px-5 py-5">
            <PortalAdForm mode="edit" initial={ad} />
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, sub, icon, highlight }: {
  label: string; value: string; sub: string; icon: string; highlight?: boolean
}) {
  return (
    <div className="px-5 py-4 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="font-display font-extrabold text-2xl mb-0.5"
        style={{ color: highlight ? '#E8634A' : '#1A0F0A' }}>
        {value}
      </div>
      <div className="text-xs font-bold" style={{ color: '#1A0F0A' }}>{label}</div>
      <div className="text-[10px]" style={{ color: '#A89080' }}>{sub}</div>
    </div>
  )
}

function InfoRow({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#8B6550' }}>{label}</p>
      {link
        ? <a href={value} target="_blank" rel="noopener noreferrer"
            className="text-sm no-underline hover:underline truncate block" style={{ color: '#E8634A' }}>
            {value}
          </a>
        : <p className="text-sm" style={{ color: '#1A0F0A' }}>{value}</p>
      }
    </div>
  )
}
