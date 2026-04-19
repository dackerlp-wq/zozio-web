import * as React from 'react'
import { BaseLayout } from './BaseLayout'
import {
  EmailShell, EmailHeader, EmailBody, EmailFooter,
  Greeting, BodyText, CtaButton, HighlightBox, Divider, colors,
} from './components'

interface Animal {
  name: string
  emoji: string
  status: string
  url?: string
}

interface Article {
  title: string
  perex?: string
  url?: string
}

interface Fundraiser {
  title: string
  current_amount: number
  goal_amount: number
}

interface InstitutionDigestEmailProps {
  institutionName: string
  period: 'week' | 'month'
  periodLabel: string // e.g. "tento týden" or "tento měsíc"
  // Animals
  newAnimals: Animal[]
  // Stats
  statReceived: number
  statAdoptedOrReleased: number
  statAvailableOrTreatment: number
  // Articles
  newArticles: Article[]
  // Fundraisers
  activeFundraisers: Fundraiser[]
  // URLs
  institutionUrl: string
  unsubscribeUrl: string
}

export function InstitutionDigestEmail({
  institutionName, period, periodLabel,
  newAnimals, statReceived, statAdoptedOrReleased, statAvailableOrTreatment,
  newArticles, activeFundraisers, institutionUrl, unsubscribeUrl,
}: InstitutionDigestEmailProps) {
  const color = colors.coral
  const colorBg = colors.shelterBg

  return (
    <BaseLayout previewText={`Novinky z ${institutionName} za ${periodLabel}`}>
      <EmailShell>
        <EmailHeader
          color="coral"
          emoji="🏠"
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
                  { num: statReceived, label: 'nových zvířat', color },
                  { num: statAdoptedOrReleased, label: 'adoptováno', color: colors.green },
                  { num: statAvailableOrTreatment, label: 'čeká na adopci', color: colors.amber },
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
              <BodyText><strong>🐾 Nová zvířata k adopci</strong></BodyText>
              <div style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 16, padding: '16px 20px', margin: '12px 0' }}>
                {newAnimals.slice(0, 5).map((a, i) => (
                  <a key={i} href={a.url ?? institutionUrl} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? `1px solid ${colors.border}` : 'none', textDecoration: 'none' }}>
                    <span style={{ fontSize: 20 }}>{a.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: color }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: colors.muted }}>{a.status}</div>
                    </div>
                  </a>
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
                <a key={i} href={article.url ?? institutionUrl} style={{ display: 'block', backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 10, textDecoration: 'none' }}>
                  <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 14, color: color }}>{article.title}</div>
                  {article.perex && <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{article.perex}</div>}
                  <div style={{ fontSize: 11, fontWeight: 700, color: color, marginTop: 6 }}>Číst více →</div>
                </a>
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
          <HighlightBox color="coral">
            Podpořte nás sdílením — každé sdílení pomáhá zvířatům najít domov. 🐾
          </HighlightBox>
          <CtaButton href={institutionUrl} color="coral">
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
