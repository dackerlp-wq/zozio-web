import * as React from 'react'

// ─── COLORS ─────────────────────────────────────────────────────────────────
export const colors = {
  coral: '#E8634A',
  amber: '#F0A500',
  dark: '#2C1810',
  warm: '#FFFCF8',
  sand: '#F5E6D3',
  rescue: '#2E9E8F',
  rescueBg: '#E4F7F5',
  shelterBg: '#FDEAE6',
  green: '#3A9E5F',
  greenBg: '#E6F7ED',
  red: '#C0392B',
  redBg: '#FDECEA',
  muted: '#8a7060',
  border: '#F0E4D4',
}

export type HeaderColor = 'coral' | 'amber' | 'rescue' | 'dark' | 'green' | 'red' | 'sand'

const headerBgMap: Record<HeaderColor, string> = {
  coral: colors.coral,
  amber: colors.amber,
  rescue: colors.rescue,
  dark: colors.dark,
  green: colors.green,
  red: colors.red,
  sand: colors.sand,
}

// ─── EMAIL HEADER ────────────────────────────────────────────────────────────
interface EmailHeaderProps {
  color: HeaderColor
  emoji: string
  title: string
  subtitle?: string
}

export function EmailHeader({ color, emoji, title, subtitle }: EmailHeaderProps) {
  const bg = headerBgMap[color]
  const isSand = color === 'sand'
  const textColor = isSand ? colors.dark : '#ffffff'
  const subtitleColor = isSand ? colors.muted : 'rgba(255,255,255,0.78)'

  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        backgroundColor: bg,
        borderRadius: '24px 24px 0 0',
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: '36px 48px 32px' }}>
            {/* Logo row */}
            <table cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td>
                    <table cellPadding={0} cellSpacing={0}>
                      <tbody>
                        <tr>
                          <td
                            style={{
                              width: 34,
                              height: 34,
                              backgroundColor: '#ffffff',
                              borderRadius: 10,
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontSize: 18,
                            }}
                          >
                            🐾
                          </td>
                          <td
                            style={{
                              paddingLeft: 10,
                              fontFamily: "'Baloo 2', 'Helvetica Neue', Arial, sans-serif",
                              fontSize: 21,
                              fontWeight: 800,
                              color: textColor,
                            }}
                          >
                            Zozio
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Emoji */}
            <div style={{ fontSize: 52, marginTop: 24, marginBottom: 12, lineHeight: 1 }}>
              {emoji}
            </div>

            {/* Title */}
            <div
              style={{
                fontFamily: "'Baloo 2', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: textColor,
                lineHeight: 1.2,
              }}
              dangerouslySetInnerHTML={{ __html: title.replace(/\n/g, '<br/>') }}
            />

            {/* Subtitle */}
            {subtitle && (
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: subtitleColor,
                  marginTop: 6,
                }}
              >
                {subtitle}
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── EMAIL BODY ──────────────────────────────────────────────────────────────
interface EmailBodyProps {
  children: React.ReactNode
}

export function EmailBody({ children }: EmailBodyProps) {
  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ backgroundColor: colors.warm }}
    >
      <tbody>
        <tr>
          <td style={{ padding: '38px 48px' }}>{children}</td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── EMAIL FOOTER ────────────────────────────────────────────────────────────
interface EmailFooterProps {
  note?: string
  showUnsubscribe?: boolean
}

export function EmailFooter({ note, showUnsubscribe = true }: EmailFooterProps) {
  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        backgroundColor: colors.sand,
        borderRadius: '0 0 24px 24px',
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: '26px 48px', textAlign: 'center' }}>
            <div
              style={{
                fontFamily: "'Baloo 2', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 17,
                fontWeight: 800,
                color: colors.dark,
                marginBottom: 8,
              }}
            >
              🐾 Zozio
            </div>
            {note && (
              <div
                style={{
                  fontSize: 12,
                  color: colors.muted,
                  fontWeight: 600,
                  lineHeight: 1.7,
                  marginBottom: 12,
                }}
              >
                {note}
              </div>
            )}
            <div>
              <a
                href="https://zozio.cz"
                style={{ fontSize: 12, fontWeight: 700, color: colors.muted, textDecoration: 'none', marginRight: 16 }}
              >
                Zozio.cz
              </a>
              <a
                href="https://zozio.cz/podpora"
                style={{ fontSize: 12, fontWeight: 700, color: colors.muted, textDecoration: 'none', marginRight: 16 }}
              >
                Podpora
              </a>
              {showUnsubscribe && (
                <a
                  href="{{unsubscribe_url}}"
                  style={{ fontSize: 12, fontWeight: 700, color: colors.muted, textDecoration: 'none', marginRight: 16 }}
                >
                  Odhlásit odběr
                </a>
              )}
              <a
                href="https://zozio.cz/ochrana-soukromi"
                style={{ fontSize: 12, fontWeight: 700, color: colors.muted, textDecoration: 'none' }}
              >
                Ochrana soukromí
              </a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── EMAIL SHELL ─────────────────────────────────────────────────────────────
export function EmailShell({ children }: { children: React.ReactNode }) {
  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(44,24,16,0.13)',
      }}
    >
      <tbody>
        <tr>
          <td>{children}</td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── GREETING ────────────────────────────────────────────────────────────────
export function Greeting({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 16, fontWeight: 700, color: colors.dark, marginBottom: 12 }}>
      {children}
    </div>
  )
}

// ─── BODY TEXT ───────────────────────────────────────────────────────────────
export function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 15,
        lineHeight: 1.7,
        color: '#5a4030',
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  )
}

// ─── INFO CARD ───────────────────────────────────────────────────────────────
interface InfoCardProps {
  title: string
  rows: { label: string; value: React.ReactNode }[]
}

export function InfoCard({ title, rows }: InfoCardProps) {
  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        border: `1.5px solid ${colors.border}`,
        margin: '22px 0',
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: '22px 22px 0' }}>
            <div
              style={{
                fontFamily: "'Baloo 2', 'Helvetica Neue', Arial, sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: '#9a8070',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 12,
              }}
            >
              {title}
            </div>
          </td>
        </tr>
        {rows.map((row, i) => (
          <tr key={i}>
            <td
              style={{
                padding: '9px 22px',
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td style={{ fontSize: 13, fontWeight: 600, color: '#9a8070' }}>
                      {row.label}
                    </td>
                    <td
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: colors.dark,
                        textAlign: 'right',
                      }}
                    >
                      {row.value}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        ))}
        <tr>
          <td style={{ height: 10 }} />
        </tr>
      </tbody>
    </table>
  )
}

// ─── CTA BUTTON ──────────────────────────────────────────────────────────────
interface CtaButtonProps {
  href: string
  color?: HeaderColor
  children: React.ReactNode
}

const ctaBgMap: Record<HeaderColor, string> = {
  coral: colors.coral,
  amber: colors.amber,
  rescue: colors.rescue,
  dark: colors.dark,
  green: colors.green,
  red: colors.red,
  sand: colors.sand,
}

export function CtaButton({ href, color = 'coral', children }: CtaButtonProps) {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '26px 0 10px' }}>
      <tbody>
        <tr>
          <td align="center">
            <a
              href={href}
              style={{
                display: 'inline-block',
                backgroundColor: ctaBgMap[color],
                color: color === 'sand' ? colors.dark : '#ffffff',
                fontFamily: "'Nunito', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                padding: '15px 34px',
                borderRadius: 100,
              }}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── HIGHLIGHT BOX ───────────────────────────────────────────────────────────
interface HighlightBoxProps {
  color: 'coral' | 'green' | 'red' | 'rescue' | 'amber' | 'sand'
  children: React.ReactNode
}

const highlightBgMap = {
  coral: colors.shelterBg,
  green: colors.greenBg,
  red: colors.redBg,
  rescue: colors.rescueBg,
  amber: '#FFF8E6',
  sand: colors.sand,
}

const highlightBorderMap = {
  coral: colors.coral,
  green: colors.green,
  red: colors.red,
  rescue: colors.rescue,
  amber: colors.amber,
  sand: '#C8A882',
}

export function HighlightBox({ color, children }: HighlightBoxProps) {
  return (
    <div
      style={{
        backgroundColor: highlightBgMap[color],
        borderLeft: `4px solid ${highlightBorderMap[color]}`,
        borderRadius: 16,
        padding: '18px 22px',
        margin: '20px 0',
        fontSize: 14,
        fontWeight: 600,
        color: colors.dark,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  )
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
export function Divider() {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: colors.border,
        margin: '26px 0',
      }}
    />
  )
}

// ─── STEP ────────────────────────────────────────────────────────────────────
interface StepProps {
  num: number
  title: string
  desc: string
  color?: string
}

export function Step({ num, title, desc, color = colors.coral }: StepProps) {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: 16 }}>
      <tbody>
        <tr>
          <td
            style={{
              width: 30,
              height: 30,
              backgroundColor: color,
              borderRadius: '50%',
              textAlign: 'center',
              verticalAlign: 'top',
              paddingTop: 5,
              fontFamily: "'Baloo 2', 'Helvetica Neue', Arial, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: '#ffffff',
            }}
          >
            {num}
          </td>
          <td style={{ paddingLeft: 14, verticalAlign: 'top' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: colors.dark, marginBottom: 3 }}>
              {title}
            </div>
            <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.5 }}>{desc}</div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
