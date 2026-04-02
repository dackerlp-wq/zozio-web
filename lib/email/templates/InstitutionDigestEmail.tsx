import * as React from 'react'
import { BaseLayout } from './BaseLayout'
import {
  EmailShell, EmailHeader, EmailBody, EmailFooter,
  Greeting, BodyText, InfoCard, CtaButton, HighlightBox, Divider, colors,
} from './components'

interface Animal {
  name: string
  emoji: string
  status: string
}

interface Article {
  title: string
  perex?: string
}

interface Fundraiser {
  title: string
  current_amount: number
  goal_amount: number
}

interface InstitutionDigestEmailProps {
  institutionName: string
  isShelter: boolean
  period: 'week' | 'month'
  periodLabel: string // e.g. "tento týden" or "tento měsíc"
  // Animals / rescue cases
  newAnimals: Animal[]
  // Stats
  statReceived: number   // new animals/cases received
  statAdoptedOrReleased: number // adopted (shelter) or released (rescue)
  statAvailableOrTreatment: number // available (shelter) or in treatment (rescue)
  // Articles
  newArticles: Article[]
  // Fundraisers
  activeFundraisers: Fundraiser[]
  // URLs
  institutionUrl: string
  unsubscribeUrl: string
}

export function InstitutionDigestEmail({
  institutionName, isShelter, period, periodLabel,
  newAnimals, statReceived, statAdoptedOrReleased, statAvailableOrTreatment,
  newArticles, activeFundraisers, institutionUrl, unsubscribeUrl,
}: InstitutionDigestEmailProps) {
  const color = isShelter ? colors.coral : colors.rescue
  const colorBg = isShelter ? colors.shelterBg : colors.rescueBg
  const headerColor = isShelter ? 'coral' : 'rescue'
  const statLabel2 = isShelter ? 'adoptováno' : 'propuštěno'
  const statLabel3 = isShelter ? 'čeká na adopci' : 'v léčbě'

  return (
    <BaseLayout previewText={`Novinky z ${institutionName} za ${periodLabel}`}>
      <EmailShell>
        <EmailHeader
          color={headerColor}
          emoji={isShelter ? '🏠' : '🚑'}
          title={`Novinky z\n${institutionName}`}
          subtitle={`Přehled za ${periodLabel}`}
        />
        <EmailBody>
          <Greeting>Ahoj!</Greeting>
          <BodyText>
            Tady jsou novinky z <strong>{institutionName}</strong> za {periodLabel}.
          </BodyText>

          {/* Stats */}
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '22px 0' }}>
            <tbody>
              <tr>
                {[
                  { num: statReceived, label: isShelter ? 'nových zvířat' : 'nových případů', color },
                  { num: statAdoptedOrReleased, label: statLabel2, color: colors.green },
                  { num: statAvailableOrTreatment, label: statLabel3, color: colors.amber },
                ].map((stat, i) => (
                  <td key={i} style={{ width: '33%', padding: i === 1 ? '0 6px' : '0' }}>
                    <div style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 14, padding: '18px 12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.num}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* New animals */}
          {newAnimals.length > 0 && (
            <>
              <Divider />
              <BodyText><strong>{isShelter ? '🐾 Nová zvířata k adopci' : '🆕 Nové záchranné případy'}</strong></BodyText>
              <div style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 16, padding: '16px 20px', margin: '12px 0' }}>
                {newAnimals.slice(0, 5).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? `1px solid ${colors.border}` : 'none' }}>
                    <span style={{ fontSize: 20 }}>{a.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: colors.dark }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: colors.muted }}>{a.status}</div>
                    </div>
                  </div>
                ))}
                {newAnimals.length > 5 && (
                  <div style={{ fontSize: 12, color: colors.muted, textAlign: 'center', paddingTop: 8 }}>
                    a dalších {newAnimals.length - 5} zvířat…
                  </div>
                )}
              </div>
            </>
          )}

          {/* Articles */}
          {newArticles.length > 0 && (
            <>
              <Divider />
              <BodyText><strong>📖 Nové příběhy</strong></BodyText>
              {newArticles.slice(0, 3).map((article, i) => (
                <div key={i} style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
                  <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 14, color: colors.dark }}>{article.title}</div>
                  {article.perex && <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{article.perex}</div>}
                </div>
              ))}
            </>
          )}

          {/* Fundraisers */}
          {activeFundraisers.length > 0 && (
            <>
              <Divider />
              <BodyText><strong>💛 Aktivní sbírky</strong></BodyText>
              {activeFundraisers.slice(0, 2).map((f, i) => {
                const pct = f.goal_amount > 0 ? Math.round((f.current_amount / f.goal_amount) * 100) : 0
                return (
                  <div key={i} style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: colors.dark, marginBottom: 8 }}>{f.title}</div>
                    <div style={{ height: 8, backgroundColor: colorBg, borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: color, borderRadius: 100 }} />
                    </div>
                    <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                      {f.current_amount.toLocaleString('cs-CZ')} Kč z {f.goal_amount.toLocaleString('cs-CZ')} Kč ({pct}%)
                    </div>
                  </div>
                )
              })}
            </>
          )}

          <Divider />
          <HighlightBox color={isShelter ? 'coral' : 'rescue'}>
            Podpořte nás sdílením — každé sdílení pomáhá zvířatům najít domov. 🐾
          </HighlightBox>
          <CtaButton href={institutionUrl} color={isShelter ? 'coral' : 'rescue'}>
            Navštívit {institutionName}
          </CtaButton>
        </EmailBody>
        <EmailFooter
          note="Nechceš dostávat tyto e-maily? Klikni na odhlásit odběr níže."
          unsubscribeUrl={unsubscribeUrl}
        />
      </EmailShell>
    </BaseLayout>
  )
}
