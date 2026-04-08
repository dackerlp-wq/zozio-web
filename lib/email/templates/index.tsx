import * as React from 'react'
import { BaseLayout } from './BaseLayout'
import {
  EmailShell,
  EmailHeader,
  EmailBody,
  EmailFooter,
  Greeting,
  BodyText,
  InfoCard,
  CtaButton,
  HighlightBox,
  Divider,
  Step,
  colors,
} from './components'

// ─────────────────────────────────────────────────────────────────────────────
// 1. VÍTEJTE / REGISTRACE
// ─────────────────────────────────────────────────────────────────────────────
interface WelcomeEmailProps {
  contactName: string
  institutionName: string
  institutionType: 'shelter' | 'rescue_station'
  email: string
}

export function WelcomeEmail({ contactName, institutionName, institutionType, email }: WelcomeEmailProps) {
  const typeLabel = institutionType === 'shelter' ? '🏠 Útulek' : '🚑 Záchranná stanice'
  return (
    <BaseLayout previewText={`Vítejte v Zozio! Vaše registrace ${institutionName} byla přijata.`}>
      <EmailShell>
        <EmailHeader color="coral" emoji="🎉" title={'Vítejte v Zozio!'} subtitle="Váš účet je vytvořen a čeká na aktivaci" />
        <EmailBody>
          <Greeting>Dobrý den, {contactName}!</Greeting>
          <BodyText>
            Děkujeme za registraci <strong>{institutionName}</strong> v platformě Zozio. Vaše žádost byla přijata a právě ji zpracováváme.
          </BodyText>
          <InfoCard title="Přehled registrace" rows={[
            { label: 'Instituce', value: institutionName },
            { label: 'Typ', value: typeLabel },
            { label: 'Kontaktní e-mail', value: email },
            { label: 'Stav', value: <span style={{ color: colors.amber }}>⏳ Čeká na schválení</span> },
          ]} />
          <BodyText>Co se stane dál?</BodyText>
          <Step num={1} title="Kontrola administrátorem" desc="Náš tým ověří vaši instituci do 1–2 pracovních dnů." />
          <Step num={2} title="E-mail se schválením" desc="Obdržíte potvrzovací e-mail s odkazem pro aktivaci." />
          <Step num={3} title="Začněte přidávat zvířata" desc="Ihned po aktivaci máte přístup k plnému admin panelu." />
          <HighlightBox color="amber">
            💡 <strong style={{ color: colors.amber }}>Tip:</strong> Připravte si fotky zvířat a jejich popis. Po aktivaci je můžete nahrát během pár minut.
          </HighlightBox>
          <CtaButton href="https://zozio.cz" color="dark">Přejít na Zozio.cz</CtaButton>
        </EmailBody>
        <EmailFooter note="Zozio.cz — platforma pro útulky a záchranné stanice" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SCHVÁLENÍ REGISTRACE
// ─────────────────────────────────────────────────────────────────────────────
interface ApprovalEmailProps {
  contactName: string
  institutionName: string
  plan: string
  adminUrl: string
}

export function ApprovalEmail({ contactName, institutionName, plan, adminUrl }: ApprovalEmailProps) {
  return (
    <BaseLayout previewText={`Gratulujeme! ${institutionName} byl schválen na Zozio.`}>
      <EmailShell>
        <EmailHeader color="green" emoji="🎉" title={'Váš útulek\nbyl schválen!'} subtitle="Vítejte oficiálně v komunitě Zozio" />
        <EmailBody>
          <Greeting>Gratulujeme, {contactName}! 🎊</Greeting>
          <BodyText>
            Váš útulek <strong>{institutionName}</strong> byl právě schválen a je nyní aktivní na Zozio.cz. Můžete okamžitě začít přidávat zvířata a přijímat adopční žádosti.
          </BodyText>
          <InfoCard title="Váš profil" rows={[
            { label: 'Instituce', value: institutionName },
            { label: 'Plán', value: plan },
            { label: 'Stav', value: <span style={{ color: colors.green }}>✅ Aktivní</span> },
          ]} />
          <BodyText>Co dělat jako první:</BodyText>
          <Step num={1} title="Doplňte profil útulku" desc="Přidejte popis, fotky a kontaktní informace." color={colors.green} />
          <Step num={2} title="Přidejte první zvíře" desc="Nahrajte profil prvního mazlíčka k adopci." color={colors.green} />
          <Step num={3} title="Sdílejte profil" desc="Sdílejte odkaz na váš profil na sociálních sítích." color={colors.green} />
          <CtaButton href={adminUrl} color="green">Přejít do admin panelu</CtaButton>
        </EmailBody>
        <EmailFooter note="Zozio.cz — platforma pro útulky a záchranné stanice" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ZAMÍTNUTÍ REGISTRACE
// ─────────────────────────────────────────────────────────────────────────────
interface RejectionEmailProps {
  contactName: string
  institutionName: string
  reason: string
  editUrl: string
}

export function RejectionEmail({ contactName, institutionName, reason, editUrl }: RejectionEmailProps) {
  return (
    <BaseLayout previewText={`Vaše registrace ${institutionName} vyžaduje doplnění.`}>
      <EmailShell>
        <EmailHeader color="sand" emoji="📋" title={'Vaše registrace\nvyžaduje doplnění'} subtitle="Potřebujeme od vás pár dalších informací" />
        <EmailBody>
          <Greeting>Dobrý den, {contactName}.</Greeting>
          <BodyText>
            Přezkoumali jsme vaši žádost o registraci <strong>{institutionName}</strong> a bohužel ji nemůžeme zatím schválit. Níže najdete důvod a instrukce, jak situaci vyřešit.
          </BodyText>
          <HighlightBox color="red">
            ⚠️ <strong style={{ color: colors.red }}>Důvod zamítnutí:</strong> {reason}
          </HighlightBox>
          <BodyText>
            Vaše registrace <strong>nebyla smazána</strong> — stačí opravit uvedené údaje a znovu odeslat žádost. Rádi vás na Zozio přivítáme.
          </BodyText>
          <CtaButton href={editUrl} color="coral">Opravit registraci</CtaButton>
          <Divider />
          <div style={{ fontSize: 13, color: '#9a8070', lineHeight: 1.6 }}>
            Máte otázky? Napište nám na{' '}
            <a href="mailto:podpora@zozio.cz" style={{ color: colors.coral, fontWeight: 700 }}>
              podpora@zozio.cz
            </a>{' '}
            — rádi pomůžeme.
          </div>
        </EmailBody>
        <EmailFooter note="Zozio.cz — platforma pro útulky a záchranné stanice" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. NOVÁ ADOPČNÍ ŽÁDOST (PRO SPRÁVCE)
// ─────────────────────────────────────────────────────────────────────────────
interface NewApplicationEmailProps {
  institutionContactName: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  applicantCity: string
  applicantHasOtherAnimals: boolean
  animalName: string
  animalEmoji: string
  animalSpecies: string
  animalAge: string
  applicationId: string
  applicationMessage: string
  adminUrl: string
}

export function NewApplicationEmail({
  institutionContactName,
  applicantName,
  applicantEmail,
  applicantPhone,
  applicantCity,
  applicantHasOtherAnimals,
  animalName,
  animalEmoji,
  animalSpecies,
  animalAge,
  applicationId,
  applicationMessage,
  adminUrl,
}: NewApplicationEmailProps) {
  return (
    <BaseLayout previewText={`Nová adopční žádost o ${animalName} od ${applicantName}`}>
      <EmailShell>
        <EmailHeader color="rescue" emoji="📩" title={'Máte novou\nadopční žádost!'} subtitle="Zájemce čeká na vaši odpověď" />
        <EmailBody>
          <Greeting>Dobrý den, {institutionContactName}!</Greeting>
          <BodyText>
            Na vašem útulku přibyla nová adopční žádost. Zájemce projevil zájem o <strong>{animalName}</strong> — přečtěte si detaily a co nejdříve ho kontaktujte.
          </BodyText>
          <InfoCard title="Žadatel" rows={[
            { label: 'Jméno', value: applicantName },
            { label: 'E-mail', value: applicantEmail },
            { label: 'Telefon', value: applicantPhone },
            { label: 'Bydliště', value: applicantCity },
            { label: 'Jiná zvířata', value: applicantHasOtherAnimals ? 'Ano' : 'Ne' },
          ]} />
          <InfoCard title="Zvíře" rows={[
            { label: 'Jméno', value: `${animalEmoji} ${animalName}` },
            { label: 'Druh / věk', value: `${animalSpecies} · ${animalAge}` },
            { label: 'Č. žádosti', value: applicationId },
          ]} />
          <HighlightBox color="rescue">
            💬 <strong>Zpráva od žadatele:</strong> „{applicationMessage}"
          </HighlightBox>
          <CtaButton href={adminUrl} color="rescue">Zobrazit žádost v panelu</CtaButton>
        </EmailBody>
        <EmailFooter note="Odpovídejte přímo v admin panelu, ne na tento e-mail." />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5X. ŽÁDOST SE POSUZUJE (PRO UŽIVATELE)
// ─────────────────────────────────────────────────────────────────────────────
interface ApplicationReviewingEmailProps {
  applicantName: string
  animalName: string
  animalEmoji: string
  institutionName: string
  applicationId: string
  detailUrl: string
  institutionNote?: string
  cancelUrl?: string
}

export function ApplicationReviewingEmail({
  applicantName,
  animalName,
  animalEmoji,
  institutionName,
  applicationId,
  detailUrl,
  institutionNote,
  cancelUrl,
}: ApplicationReviewingEmailProps) {
  return (
    <BaseLayout previewText={`${institutionName} začal posuzovat vaší žádost o adopci ${animalName}.`}>
      <EmailShell>
        <EmailHeader color="rescue" emoji="🔍" title={'Vaše žádost\nse posuzuje'} subtitle={`${institutionName} ji právě prochází`} />
        <EmailBody>
          <Greeting>Ahoj, {applicantName}!</Greeting>
          <BodyText>
            Dobrá zpráva — {institutionName} začal posuzovat vaší žádost o adopci <strong>{animalEmoji} {animalName}</strong>. Pečlivě ji procházíme a brzy se vám ozveme.
          </BodyText>
          {institutionNote && (
            <HighlightBox color="rescue">
              💬 <strong>Zpráva od útulku:</strong> „{institutionNote}"
            </HighlightBox>
          )}
          <HighlightBox color="rescue">
            ⏳ Posuzování obvykle trvá <strong>1–3 pracovní dny</strong>. Nemusíte nic dělat — ozveme se e-mailem.
          </HighlightBox>
          <InfoCard title="Detail žádosti" rows={[
            { label: 'Zvíře', value: `${animalEmoji} ${animalName}` },
            { label: 'Útulek', value: institutionName },
            { label: 'Č. žádosti', value: applicationId },
            { label: 'Stav', value: <span style={{ color: colors.rescue }}>🔍 Posuzuje se</span> },
          ]} />
          <CtaButton href={detailUrl} color="rescue">Sledovat stav žádosti</CtaButton>
          {cancelUrl && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <a href={cancelUrl} style={{ fontSize: 12, color: colors.muted, textDecoration: 'underline' }}>
                Zrušit žádost o adopci
              </a>
            </div>
          )}
        </EmailBody>
        <EmailFooter note="Zozio.cz — propojujeme zvířata s domovy" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5A. ŽÁDOST SCHVÁLENA (PRO UŽIVATELE)
// ─────────────────────────────────────────────────────────────────────────────
interface ApplicationApprovedEmailProps {
  applicantName: string
  animalName: string
  animalEmoji: string
  institutionName: string
  institutionContactName: string
  institutionPhone: string
  institutionEmail: string
  adoptionFee: string
  applicationId: string
  detailUrl: string
}

export function ApplicationApprovedEmail({
  applicantName,
  animalName,
  animalEmoji,
  institutionName,
  institutionContactName,
  institutionPhone,
  institutionEmail,
  adoptionFee,
  applicationId,
  detailUrl,
}: ApplicationApprovedEmailProps) {
  return (
    <BaseLayout previewText={`Skvělá zpráva! Vaše žádost o adopci ${animalName} byla schválena.`}>
      <EmailShell>
        <EmailHeader color="green" emoji="🎊" title={'Vaše žádost\nbyla schválena!'} subtitle={`${institutionName} vás přijal — gratulujeme!`} />
        <EmailBody>
          <Greeting>{applicantName}, skvělá zpráva! 🐾</Greeting>
          <BodyText>
            {institutionName} vaši žádost o adopci <strong>{animalName} schválil</strong>. Poslední krok je domluvit osobní setkání a předání.
          </BodyText>
          <div style={{ backgroundColor: colors.greenBg, borderRadius: 20, padding: '28px 32px', textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📞</div>
            <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 800, color: colors.dark, marginBottom: 6 }}>
              Zavolejte nebo napište útulku
            </div>
            <div style={{ fontSize: 13, color: colors.muted, fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>
              {institutionContactName} · {institutionName}<br />
              {institutionPhone} · {institutionEmail}
            </div>
            <a href={detailUrl} style={{ display: 'inline-block', backgroundColor: colors.green, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', padding: '12px 28px', borderRadius: 100 }}>
              Potvrdit termín předání
            </a>
          </div>
          <InfoCard title="Detail adopce" rows={[
            { label: 'Zvíře', value: `${animalEmoji} ${animalName}` },
            { label: 'Útulek', value: institutionName },
            { label: 'Poplatek', value: `${adoptionFee} (při předání)` },
            { label: 'Č. žádosti', value: applicationId },
            { label: 'Stav', value: <span style={{ color: colors.green }}>✅ Schválena</span> },
          ]} />
        </EmailBody>
        <EmailFooter note="Zozio.cz — propojujeme zvířata s domovy" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5B. ŽÁDOST ZAMÍTNUTA (PRO UŽIVATELE)
// ─────────────────────────────────────────────────────────────────────────────
interface ApplicationRejectedEmailProps {
  applicantName: string
  animalName: string
  institutionName: string
  institutionMessage?: string
  browseUrl: string
}

export function ApplicationRejectedEmail({
  applicantName,
  animalName,
  institutionName,
  institutionMessage,
  browseUrl,
}: ApplicationRejectedEmailProps) {
  return (
    <BaseLayout previewText={`Zpráva ohledně vaší žádosti o adopci ${animalName}`}>
      <EmailShell>
        <EmailHeader color="sand" emoji="💌" title={'Vaše žádost\nnebyla přijata'} subtitle="Nevzdávejte to — jiné zvíře na vás čeká" />
        <EmailBody>
          <Greeting>Dobrý den, {applicantName}.</Greeting>
          <BodyText>
            {institutionName} vaši žádost o adopci <strong>{animalName}</strong> tentokrát neschválil. Víme, že to není snadné — ale ideální zvíře pro vás se stále někde nachází.
          </BodyText>
          {institutionMessage && (
            <HighlightBox color="sand">
              💬 <strong>Vzkaz od útulku:</strong> „{institutionMessage}"
            </HighlightBox>
          )}
          <div style={{ backgroundColor: colors.shelterBg, borderRadius: 20, padding: '28px 32px', textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🐾</div>
            <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 800, color: colors.dark, marginBottom: 6 }}>
              Najděte svého mazlíčka
            </div>
            <div style={{ fontSize: 13, color: colors.muted, fontWeight: 600, marginBottom: 16 }}>
              Na Zozio.cz aktuálně čeká na domov přes 300 zvířat.
            </div>
            <a href={browseUrl} style={{ display: 'inline-block', backgroundColor: colors.coral, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', padding: '12px 28px', borderRadius: 100 }}>
              Procházet zvířata
            </a>
          </div>
        </EmailBody>
        <EmailFooter note="Zozio.cz — propojujeme zvířata s domovy" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5C. SCHŮZKA NAPLÁNOVÁNA (PRO UŽIVATELE)
// ─────────────────────────────────────────────────────────────────────────────
interface MeetingScheduledEmailProps {
  applicantName: string
  animalName: string
  animalEmoji: string
  institutionName: string
  institutionPhone: string
  institutionEmail: string
  meetingOptions: string[]
  meetingAt?: string
  applicationId: string
  institutionNote?: string
  detailUrl: string
  confirmBaseUrl?: string
  cancelUrl?: string
}

export function MeetingScheduledEmail({
  applicantName,
  animalName,
  animalEmoji,
  institutionName,
  institutionPhone,
  institutionEmail,
  meetingOptions,
  meetingAt,
  applicationId,
  institutionNote,
  detailUrl,
  confirmBaseUrl,
  cancelUrl,
}: MeetingScheduledEmailProps) {
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('cs-CZ', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <BaseLayout previewText={`${institutionName} chce domluvit termín setkání ohledně adopce ${animalName}.`}>
      <EmailShell>
        <EmailHeader color="rescue" emoji="📅" title={'Chceme se s vámi\nsetkat!'} subtitle={`${institutionName} posoudil vaši žádost`} />
        <EmailBody>
          <Greeting>Ahoj, {applicantName}!</Greeting>
          <BodyText>
            Skvělá zpráva — {institutionName} posoudil vaší žádost o adopci <strong>{animalEmoji} {animalName}</strong> a chce domluvit termín osobního setkání. Pokud vše projde, z největší pravděpodobností je {animalName} váš!
          </BodyText>
          {institutionNote && (
            <HighlightBox color="rescue">
              💬 <strong>Zpráva od útulku:</strong> „{institutionNote}"
            </HighlightBox>
          )}
          {meetingAt && (
            <div style={{ margin: '24px 0' }}>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 15, fontWeight: 800, color: colors.dark, marginBottom: 10 }}>
                📅 Potvrzený termín schůzky
              </div>
              <div style={{ backgroundColor: colors.rescueBg, borderRadius: 12, padding: '16px 20px', fontSize: 16, fontWeight: 700, color: colors.dark }}>
                {formatDate(meetingAt)}
              </div>
            </div>
          )}
          {!meetingAt && meetingOptions.length > 0 && (
            <div style={{ margin: '24px 0' }}>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 15, fontWeight: 800, color: colors.dark, marginBottom: 12 }}>
                📅 Navrhované termíny — vyberte jeden
              </div>
              {meetingOptions.map((opt, i) => (
                <div key={i} style={{ backgroundColor: colors.rescueBg ?? '#E1F5EE', borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: confirmBaseUrl ? 10 : 0 }}>
                    {i + 1}. {formatDate(opt)}
                  </div>
                  {confirmBaseUrl && (
                    <a href={`${confirmBaseUrl}${i}`}
                      style={{ display: 'inline-block', backgroundColor: colors.rescue, color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none', padding: '7px 18px', borderRadius: 100 }}>
                      ✅ Potvrdit tento termín
                    </a>
                  )}
                </div>
              ))}
              {!confirmBaseUrl && (
                <div style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>
                  Kontaktujte útulek a potvrďte termín, který vám vyhovuje.
                </div>
              )}
            </div>
          )}
          <div style={{ backgroundColor: colors.shelterBg, borderRadius: 20, padding: '28px 32px', textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📞</div>
            <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 800, color: colors.dark, marginBottom: 6 }}>
              Zavolejte nebo napište útulku
            </div>
            <div style={{ fontSize: 13, color: colors.muted, fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>
              {institutionName}<br />
              {institutionPhone && <>{institutionPhone} · </>}{institutionEmail}
            </div>
            <a href={detailUrl} style={{ display: 'inline-block', backgroundColor: colors.rescue, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', padding: '12px 28px', borderRadius: 100 }}>
              Zobrazit detail žádosti
            </a>
          </div>
          <InfoCard title="Detail adopce" rows={[
            { label: 'Zvíře', value: `${animalEmoji} ${animalName}` },
            { label: 'Útulek', value: institutionName },
            { label: 'Č. žádosti', value: applicationId },
            { label: 'Stav', value: <span style={{ color: colors.rescue }}>📅 Schůzka se plánuje</span> },
          ]} />
          {cancelUrl && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <a href={cancelUrl} style={{ fontSize: 12, color: colors.muted, textDecoration: 'underline' }}>
                Zrušit žádost o adopci
              </a>
            </div>
          )}
        </EmailBody>
        <EmailFooter note="Zozio.cz — propojujeme zvířata s domovy" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ADOPČNÍ ŽÁDOST POTVRZENA (PRO ZÁJEMCE)
// ─────────────────────────────────────────────────────────────────────────────
interface AdoptionRequestConfirmedEmailProps {
  applicantName: string
  animalName: string
  animalEmoji: string
  animalSpecies: string
  animalAge: string
  institutionName: string
  applicationId: string
  trackUrl: string
  animalPhotoUrl?: string
  cancelUrl?: string
}

export function AdoptionRequestConfirmedEmail({
  applicantName,
  animalName,
  animalEmoji,
  animalSpecies,
  animalAge,
  institutionName,
  applicationId,
  trackUrl,
  animalPhotoUrl,
  cancelUrl,
}: AdoptionRequestConfirmedEmailProps) {
  return (
    <BaseLayout previewText={`Vaše žádost o adopci ${animalName} byla přijata — ${institutionName} vás brzy zkontaktuje.`}>
      <EmailShell>
        <EmailHeader color="rescue" emoji="📬" title={'Vaše žádost\nbyla přijata!'} subtitle={`${institutionName} vás brzy zkontaktuje`} />
        <EmailBody>
          <Greeting>Ahoj, {applicantName}!</Greeting>
          <BodyText>
            Skvělá zpráva — vaše žádost o adopci byla úspěšně odeslána do útulku. Držíme vám tlapky! 🐾
          </BodyText>
          <div style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 20, overflow: 'hidden', margin: '24px 0' }}>
            <div style={{ backgroundColor: colors.shelterBg, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, textAlign: 'center', padding: '20px 0', position: 'relative' }}>
              {animalPhotoUrl
                ? <img src={animalPhotoUrl} alt={animalName} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                : animalEmoji
              }
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 22, fontWeight: 800, color: colors.dark }}>{animalName}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 100, backgroundColor: colors.sand, color: colors.dark }}>{animalEmoji} {animalSpecies}</span>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 100, backgroundColor: colors.sand, color: colors.dark }}>{animalAge}</span>
              </div>
            </div>
          </div>
          <InfoCard title="Detail žádosti" rows={[
            { label: 'Č. žádosti', value: applicationId },
            { label: 'Útulek', value: institutionName },
            { label: 'Stav', value: <span style={{ color: colors.rescue }}>✅ Přijato — čeká na kontakt</span> },
          ]} />
          <HighlightBox color="rescue">
            📞 Útulek vás <strong>zkontaktuje do 3 pracovních dnů</strong> telefonicky nebo e-mailem.
          </HighlightBox>
          <CtaButton href={trackUrl} color="rescue">Sledovat stav žádosti</CtaButton>
          {cancelUrl && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <a href={cancelUrl} style={{ fontSize: 12, color: colors.muted, textDecoration: 'underline' }}>
                Zrušit žádost o adopci
              </a>
            </div>
          )}
        </EmailBody>
        <EmailFooter note="Zozio.cz — propojujeme zvířata s domovy" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5D. TERMÍN SCHŮZKY POTVRZEN ŽADATELEM (PRO ÚTULEK)
// ─────────────────────────────────────────────────────────────────────────────
interface MeetingConfirmedEmailProps {
  institutionContactName: string
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  animalName: string
  animalEmoji: string
  confirmedDate: string
  applicationId: string
  adminUrl: string
}

export function MeetingConfirmedEmail({
  institutionContactName,
  applicantName,
  applicantEmail,
  applicantPhone,
  animalName,
  animalEmoji,
  confirmedDate,
  applicationId,
  adminUrl,
}: MeetingConfirmedEmailProps) {
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('cs-CZ', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return iso }
  }

  return (
    <BaseLayout previewText={`${applicantName} potvrdil/a termín schůzky ohledně adopce ${animalName}.`}>
      <EmailShell>
        <EmailHeader color="green" emoji="✅" title={'Termín schůzky\nbyl potvrzen!'} subtitle={`${applicantName} potvrdil/a termín`} />
        <EmailBody>
          <Greeting>Dobrý den, {institutionContactName}!</Greeting>
          <BodyText>
            Žadatel/ka <strong>{applicantName}</strong> potvrdil/a termín schůzky ohledně adopce <strong>{animalEmoji} {animalName}</strong>.
          </BodyText>
          <div style={{ backgroundColor: colors.greenBg, borderRadius: 16, padding: '20px 24px', margin: '20px 0' }}>
            <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 13, fontWeight: 800, color: colors.green, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ✅ Potvrzený termín
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: colors.dark }}>
              {formatDate(confirmedDate)}
            </div>
          </div>
          <InfoCard title="Žadatel" rows={[
            { label: 'Jméno', value: applicantName },
            { label: 'E-mail', value: applicantEmail },
            ...(applicantPhone ? [{ label: 'Telefon', value: applicantPhone }] : []),
            { label: 'Č. žádosti', value: applicationId },
          ]} />
          <CtaButton href={adminUrl} color="green">Zobrazit žádost v panelu</CtaButton>
        </EmailBody>
        <EmailFooter note="Zozio.cz — platforma pro útulky a záchranné stanice" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ZVÍŘE BYLO ADOPTOVÁNO
// ─────────────────────────────────────────────────────────────────────────────
interface AnimalAdoptedEmailProps {
  adoptorName: string
  animalName: string
  animalEmoji: string
  institutionName: string
  shareUrl: string
}

export function AnimalAdoptedEmail({ adoptorName, animalName, animalEmoji, institutionName, shareUrl }: AnimalAdoptedEmailProps) {
  return (
    <BaseLayout previewText={`Gratulujeme! ${animalName} má nový domov! 🏡`}>
      <EmailShell>
        <EmailHeader color="amber" emoji="🏡" title={`Gratulujeme!\n${animalName} má domov!`} subtitle="Adopce úspěšně dokončena" />
        <EmailBody>
          <Greeting>{adoptorName}, jste skvělí! 🎉</Greeting>
          <BodyText>
            Adopce <strong>{animalName}</strong> je officiálně dokončena. Dnes pro vás {animalName} opustil útulek {institutionName} a začíná novou kapitolu — u vás doma.
          </BodyText>
          <HighlightBox color="amber">
            ❤️ <strong style={{ color: colors.amber }}>Pamatujte:</strong> {animalName} bude potřebovat čas na adaptaci. Dejte mu klid, prostor a hodně lásky.
          </HighlightBox>
          <BodyText>Pár tipů pro první dny:</BodyText>
          <Step num={1} title="Návštěva veterináře" desc="Do 14 dnů doporučujeme kontrolu u vašeho vet. lékaře." color={colors.amber} />
          <Step num={2} title="Registrace na obci" desc="Přihlaste mazlíčka do 15 dnů na obecním úřadě." color={colors.amber} />
          <Step num={3} title="Sdílejte váš příběh" desc="Přidejte fotku na Zozio a inspirujte ostatní k adopci!" color={colors.amber} />
          <CtaButton href={shareUrl} color="coral">Sdílet příběh {animalName}</CtaButton>
        </EmailBody>
        <EmailFooter note={`Děkujeme, že jste dali ${animalName} druhou šanci. Jste hrdina! 🦸`} />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. NOVÉ ZVÍŘE V ÚTULKU
// ─────────────────────────────────────────────────────────────────────────────
interface NewAnimalEmailProps {
  animalName: string
  animalEmoji: string
  animalSpecies: string
  animalAge: string
  animalSize?: string
  animalDescription: string
  institutionName: string
  adoptionFee: string
  animalUrl: string
  browseUrl: string
}

export function NewAnimalEmail({
  animalName,
  animalEmoji,
  animalSpecies,
  animalAge,
  animalSize,
  animalDescription,
  institutionName,
  adoptionFee,
  animalUrl,
  browseUrl,
}: NewAnimalEmailProps) {
  return (
    <BaseLayout previewText={`${animalName} hledá domov — ${institutionName}`}>
      <EmailShell>
        <EmailHeader color="coral" emoji={animalEmoji} title={'Nový kamarád\nhledá domov!'} subtitle={`${institutionName} — právě přidáno`} />
        <EmailBody>
          <Greeting>Ahoj!</Greeting>
          <BodyText>
            V {institutionName} se objevil nový čtyřnohý kamarád a čeká na toho pravého. Mohl by to být právě váš nový nejlepší přítel?
          </BodyText>
          <div style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 20, overflow: 'hidden', margin: '24px 0' }}>
            <div style={{ backgroundColor: colors.shelterBg, height: 160, textAlign: 'center', fontSize: 72, lineHeight: '160px', position: 'relative' }}>
              {animalEmoji}
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 22, fontWeight: 800, color: colors.dark }}>{animalName}</div>
              <div style={{ marginTop: 8, marginBottom: 12 }}>
                {[animalSpecies, animalAge, animalSize].filter(Boolean).map((tag, i) => (
                  <span key={i} style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 100, backgroundColor: colors.sand, color: colors.dark, marginRight: 6 }}>{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6 }}>{animalDescription}</div>
            </div>
          </div>
          <InfoCard title="Základní info" rows={[
            { label: 'Útulek', value: institutionName },
            { label: 'Poplatek za adopci', value: adoptionFee },
            { label: 'Vakcinace', value: '✅ Kompletní' },
          ]} />
          <CtaButton href={animalUrl} color="coral">Zobrazit profil</CtaButton>
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: 8 }}>
            <tbody><tr><td align="center">
              <a href={browseUrl} style={{ display: 'inline-block', backgroundColor: 'transparent', color: colors.coral, border: `2px solid ${colors.coral}`, fontWeight: 700, fontSize: 14, textDecoration: 'none', padding: '13px 32px', borderRadius: 100 }}>
                Procházet další zvířata
              </a>
            </td></tr></tbody>
          </table>
        </EmailBody>
        <EmailFooter note={`Dostáváte tento e-mail, protože sledujete ${institutionName} na Zozio.cz`} />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. RESET HESLA
// ─────────────────────────────────────────────────────────────────────────────
interface ResetPasswordEmailProps {
  resetUrl: string
  expiresInMinutes?: number
}

export function ResetPasswordEmail({ resetUrl, expiresInMinutes = 30 }: ResetPasswordEmailProps) {
  return (
    <BaseLayout previewText="Obnova hesla Zozio — platí 30 minut">
      <EmailShell>
        <EmailHeader color="dark" emoji="🔐" title="Obnova hesla" subtitle={`Požadavek byl přijat · platí ${expiresInMinutes} minut`} />
        <EmailBody>
          <Greeting>Dobrý den!</Greeting>
          <BodyText>
            Přijali jsme požadavek na reset hesla vašeho Zozio účtu. Klikněte na tlačítko níže a nastavte si nové heslo.
          </BodyText>
          <CtaButton href={resetUrl} color="dark">Nastavit nové heslo</CtaButton>
          <HighlightBox color="amber">
            ⏱ <strong style={{ color: colors.amber }}>Pozor:</strong> Odkaz je platný pouze <strong style={{ color: colors.amber }}>{expiresInMinutes} minut</strong> od doručení tohoto e-mailu.
          </HighlightBox>
          <Divider />
          <div style={{ fontSize: 13, color: '#9a8070', lineHeight: 1.6 }}>
            Pokud jste o reset hesla nežádali, tento e-mail ignorujte. Váš účet je v bezpečí a heslo zůstane beze změny.
          </div>
        </EmailBody>
        <EmailFooter note="Zozio.cz — tento e-mail byl vygenerován automaticky, neodpovídejte na něj." showUnsubscribe={false} />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. POTVRZENÍ E-MAILU
// ─────────────────────────────────────────────────────────────────────────────
interface VerifyEmailProps {
  verifyUrl: string
}

export function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <BaseLayout previewText="Ověřte svůj e-mail a dokončete registraci na Zozio">
      <EmailShell>
        <EmailHeader color="coral" emoji="✉️" title={'Ověřte svůj\ne-mail'} subtitle="Jeden klik a jste v Zozio!" />
        <EmailBody>
          <Greeting>Ahoj!</Greeting>
          <BodyText>
            Děkujeme za registraci na Zozio.cz. Posledním krokem je ověření vaší e-mailové adresy. Klikněte na tlačítko níže a váš účet bude aktivován.
          </BodyText>
          <CtaButton href={verifyUrl} color="coral">Ověřit e-mailovou adresu</CtaButton>
          <Divider />
          <div style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Nebo zkopírujte tento odkaz do prohlížeče:</div>
          <div style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: '12px 16px', wordBreak: 'break-all', fontSize: 12, color: colors.muted, fontFamily: 'monospace' }}>
            {verifyUrl}
          </div>
          <HighlightBox color="coral">
            🐾 <strong>Tip:</strong> Po ověření budete přesměrováni přímo do admin panelu vašeho útulku.
          </HighlightBox>
        </EmailBody>
        <EmailFooter note="Pokud jste si účet nezakládali, tento e-mail ignorujte." showUnsubscribe={false} />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. FAKTURA / PLATBA PŘEDPLATNÉHO
// ─────────────────────────────────────────────────────────────────────────────
interface InvoiceEmailProps {
  contactName: string
  institutionName: string
  invoiceNumber: string
  planName: string
  periodFrom: string
  periodTo: string
  priceWithoutVat: string
  vat: string
  totalPrice: string
  paymentDate: string
  cardLast4: string
  ico: string
  nextPaymentDate: string
  invoiceUrl: string
}

export function InvoiceEmail({
  contactName,
  institutionName,
  invoiceNumber,
  planName,
  periodFrom,
  periodTo,
  priceWithoutVat,
  vat,
  totalPrice,
  paymentDate,
  cardLast4,
  ico,
  nextPaymentDate,
  invoiceUrl,
}: InvoiceEmailProps) {
  return (
    <BaseLayout previewText={`Faktura ${invoiceNumber} — ${totalPrice} · ${institutionName}`}>
      <EmailShell>
        <EmailHeader color="amber" emoji="🧾" title="Platba přijata" subtitle={`Předplatné prodlouženo · ${planName}`} />
        <EmailBody>
          <Greeting>Dobrý den, {contactName}!</Greeting>
          <BodyText>
            Vaše platba za předplatné Zozio {planName} pro <strong>{institutionName}</strong> byla úspěšně zpracována.
          </BodyText>
          {/* Invoice table */}
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${colors.border}`, margin: '22px 0', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: colors.sand }}>
                <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#9a8070', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left' }}>Položka</th>
                <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#9a8070', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'right' }}>Cena</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: colors.dark }}>Zozio {planName} — měsíční plán</div>
                  <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{periodFrom} – {periodTo}</div>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${colors.border}`, textAlign: 'right', fontSize: 14, fontWeight: 600, color: colors.dark }}>{priceWithoutVat}</td>
              </tr>
              <tr>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${colors.border}`, fontSize: 13, color: colors.muted }}>DPH 21 %</td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${colors.border}`, textAlign: 'right', fontSize: 13, color: colors.muted }}>{vat}</td>
              </tr>
              <tr style={{ backgroundColor: colors.dark }}>
                <td style={{ padding: '13px 18px', fontSize: 15, fontWeight: 700, color: '#fff' }}>Celkem</td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: 15, fontWeight: 700, color: '#fff' }}>{totalPrice}</td>
              </tr>
            </tbody>
          </table>
          <InfoCard title="Fakturační údaje" rows={[
            { label: 'Č. faktury', value: invoiceNumber },
            { label: 'Datum úhrady', value: paymentDate },
            { label: 'Způsob platby', value: `Karta · •••• ${cardLast4}` },
            { label: 'IČO', value: ico },
            { label: 'Příští platba', value: nextPaymentDate },
          ]} />
          <CtaButton href={invoiceUrl} color="amber">Stáhnout PDF fakturu</CtaButton>
        </EmailBody>
        <EmailFooter note="Faktura byla vystavena elektronicky a je daňově platná bez razítka." showUnsubscribe={false} />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. EXPIRACE PŘEDPLATNÉHO
// ─────────────────────────────────────────────────────────────────────────────
interface SubscriptionExpiringEmailProps {
  contactName: string
  institutionName: string
  planName: string
  expiresDate: string
  daysLeft: number
  renewUrl: string
  upgradeUrl: string
}

export function SubscriptionExpiringEmail({
  contactName,
  institutionName,
  planName,
  expiresDate,
  daysLeft,
  renewUrl,
  upgradeUrl,
}: SubscriptionExpiringEmailProps) {
  const progressPercent = Math.max(5, Math.round((daysLeft / 30) * 100))
  return (
    <BaseLayout previewText={`Vaše předplatné Zozio vyprší za ${daysLeft} dní — obnovte ho včas`}>
      <EmailShell>
        <EmailHeader color="coral" emoji="⏳" title={'Předplatné\nbrzy vyprší'} subtitle={`Zbývá ${daysLeft} dní · obnovte do ${expiresDate}`} />
        <EmailBody>
          <Greeting>Dobrý den, {contactName}!</Greeting>
          <BodyText>
            Vaše předplatné Zozio {planName} u <strong>{institutionName}</strong> vyprší za <strong>{daysLeft} dní</strong>, přesně {expiresDate}. Pokud neprodloužíte, váš profil přejde do omezeného režimu.
          </BodyText>
          <InfoCard title="Co se stane po expiraci" rows={[
            { label: 'Profil útulku', value: <span style={{ color: colors.amber }}>⚠️ Skrytý z výsledků</span> },
            { label: 'Adopční žádosti', value: <span style={{ color: colors.amber }}>⚠️ Pozastaveny</span> },
            { label: 'Zvířata', value: '✅ Zachována (max. 3)' },
            { label: 'Data', value: '✅ Bezpečná (90 dní)' },
          ]} />
          {/* Progress bar */}
          <div style={{ marginBottom: 22 }}>
            <table width="100%" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={{ fontSize: 13, fontWeight: 700, color: colors.muted }}>Zbývá do expirace</td>
                  <td style={{ fontSize: 13, fontWeight: 700, color: colors.coral, textAlign: 'right' }}>{daysLeft} dní</td>
                </tr>
              </tbody>
            </table>
            <div style={{ backgroundColor: '#F0E4D4', borderRadius: 100, height: 10, margin: '8px 0 4px', overflow: 'hidden' }}>
              <div style={{ height: 10, borderRadius: 100, backgroundColor: colors.coral, width: `${progressPercent}%` }} />
            </div>
            <div style={{ fontSize: 11, color: '#9a8070', fontWeight: 600, textAlign: 'right' }}>Vyprší {expiresDate}</div>
          </div>
          <div style={{ backgroundColor: '#FFF8E6', borderRadius: 20, padding: '28px 32px', textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
            <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 800, color: colors.dark, marginBottom: 6 }}>
              Prodloužit {planName} plán
            </div>
            <div style={{ fontSize: 13, color: colors.muted, fontWeight: 600, marginBottom: 16 }}>
              790 Kč / měsíc · neomezená zvířata · priority podpora
            </div>
            <a href={renewUrl} style={{ display: 'inline-block', backgroundColor: colors.amber, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', padding: '12px 28px', borderRadius: 100 }}>
              Obnovit předplatné
            </a>
          </div>
          <HighlightBox color="coral">
            💡 <strong>Přejít na Pro?</strong> Za 1 990 Kč/měs získáte analytiky, donační sbírky a vlastní doménu profilu.{' '}
            <a href={upgradeUrl} style={{ color: colors.coral }}>Zjistit více →</a>
          </HighlightBox>
        </EmailBody>
        <EmailFooter note="Toto upozornění dostanete 7 dní a 1 den před expirací." />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. ONBOARDING TIPY — EMAIL 2/3
// ─────────────────────────────────────────────────────────────────────────────
interface OnboardingTipsEmailProps {
  contactName: string
  institutionName: string
  hasProfilePhoto: boolean
  hasDescription: boolean
  hasSocialLinks: boolean
  animalCount: number
  completeProfileUrl: string
}

export function OnboardingTipsEmail({
  contactName,
  institutionName,
  hasProfilePhoto,
  hasDescription,
  hasSocialLinks,
  animalCount,
  completeProfileUrl,
}: OnboardingTipsEmailProps) {
  const checklist = [
    { done: true, label: 'Registrace dokončena', desc: `${institutionName} je aktivní na Zozio.cz` },
    { done: animalCount > 0, label: animalCount > 0 ? `${animalCount} zvíře přidáno` : 'Přidejte první zvíře', desc: animalCount > 0 ? 'Profily jsou viditelné pro veřejnost' : 'Nahrajte profil prvního mazlíčka k adopci.' },
    { done: hasProfilePhoto, label: hasProfilePhoto ? 'Fotka profilu přidána' : 'Přidejte fotku profilu útulku', desc: 'Útulky s fotkou dostávají 3× více žádostí' },
    { done: hasDescription, label: hasDescription ? 'Popis útulku vyplněn' : 'Doplňte popis útulku', desc: 'Řekněte lidem, kdo jste a co děláte' },
    { done: hasSocialLinks, label: hasSocialLinks ? 'Sociální sítě propojeny' : 'Propojte sociální sítě', desc: 'Instagram a Facebook přinesou více návštěvníků' },
  ]
  return (
    <BaseLayout previewText={`Jak na to — tipy pro váš útulek · Email 2/3`}>
      <EmailShell>
        <EmailHeader color="rescue" emoji="🚀" title={'Jak na to —\ntipy pro váš útulek'} subtitle="Email 2 ze 3 · Dokončete nastavení" />
        <EmailBody>
          <Greeting>Dobrý den, {contactName}!</Greeting>
          <BodyText>
            Jste na Zozio 3 dny — hurá! Tady jsou tipy, jak z Zozio vytěžit maximum pro {institutionName}:
          </BodyText>
          <div style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 16, padding: '20px 22px', margin: '22px 0' }}>
            <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 13, color: '#9a8070', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
              Váš postup
            </div>
            {checklist.map((item, i) => (
              <table key={i} width="100%" cellPadding={0} cellSpacing={0} style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : undefined }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                      <table cellPadding={0} cellSpacing={0}>
                        <tbody>
                          <tr>
                            <td style={{ width: 28, height: 28, backgroundColor: item.done ? colors.greenBg : colors.sand, borderRadius: '50%', textAlign: 'center', verticalAlign: 'middle', fontSize: 14 }}>
                              {item.done ? '✅' : '○'}
                            </td>
                            <td style={{ paddingLeft: 12 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: item.done ? colors.dark : '#9a8070' }}>{item.label}</div>
                              <div style={{ fontSize: 12, color: colors.muted, fontWeight: 600, marginTop: 2 }}>{item.desc}</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
          </div>
          <HighlightBox color="rescue">
            📊 <strong>Věděli jste?</strong> Profily s vyplněným popisem a fotkou útulku dostávají průměrně <strong>340 % více adopčních žádostí</strong> oproti prázdným profilům.
          </HighlightBox>
          <CtaButton href={completeProfileUrl} color="rescue">Dokončit nastavení profilu</CtaButton>
          <Divider />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9a8070', textAlign: 'center' }}>
            Za 4 dny dostanete email 3/3 — tipy jak propagovat vaše zvířata.
          </div>
        </EmailBody>
        <EmailFooter note="Onboarding série · Email 2 ze 3" />
      </EmailShell>
    </BaseLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. POTVRZENÍ ODBĚRU NEWSLETTERU
// ─────────────────────────────────────────────────────────────────────────────
interface NewsletterSubscribeConfirmEmailProps {
  name?: string
  institutionName?: string // null = Zozio global newsletter
  unsubscribeUrl: string
}

export function NewsletterSubscribeConfirmEmail({
  name,
  institutionName,
  unsubscribeUrl,
}: NewsletterSubscribeConfirmEmailProps) {
  const isGlobal = !institutionName
  const greeting = name ? `Ahoj, ${name}!` : 'Ahoj!'
  const title = isGlobal ? 'Odběr Zozio\nnovinkami potvrzen' : `Odběr novinek\nod ${institutionName}`
  const subtitle = isGlobal
    ? 'Budeme tě informovat o adopcích, záchranách a dění na Zozio'
    : `Teď tě budeme informovat o novinkách z ${institutionName}`

  return (
    <BaseLayout previewText={isGlobal ? `Jsi přihlášen/a k odběru novinek Zozio.cz` : `Jsi přihlášen/a k novinkám od ${institutionName}`}>
      <EmailShell>
        <EmailHeader
          color={isGlobal ? 'coral' : 'rescue'}
          emoji="📬"
          title={title}
          subtitle={subtitle}
        />
        <EmailBody>
          <Greeting>{greeting}</Greeting>
          <BodyText>
            {isGlobal
              ? 'Úspěšně jsi se přihlásil/a k odběru Zozio novinek. Budeme tě jednou měsíčně informovat o adopcích, záchranách a zvířatech, která hledají nový domov.'
              : `Úspěšně jsi se přihlásil/a k odběru novinek od ${institutionName}. Instituci nyní sleduješ — budou ti chodit přehledy novinek.`
            }
          </BodyText>
          {!isGlobal && (
            <div style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 16, padding: '18px 22px', margin: '18px 0' }}>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 13, color: '#9a8070', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
                Co budeš dostávat
              </div>
              {[
                { icon: '📅', title: 'Týdenní přehled', desc: `Nová zvířata, příběhy a sbírky z ${institutionName} za poslední týden` },
                { icon: '🗓️', title: 'Měsíční přehled', desc: `Kompletní souhrn událostí a statistik z ${institutionName} za měsíc` },
              ].map((item, i) => (
                <table key={i} width="100%" cellPadding={0} cellSpacing={0} style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : undefined }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 0', verticalAlign: 'top' }}>
                        <table cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td style={{ width: 32, fontSize: 20, verticalAlign: 'middle' }}>{item.icon}</td>
                              <td style={{ paddingLeft: 10 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: colors.dark }}>{item.title}</div>
                                <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{item.desc}</div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ))}
            </div>
          )}
          <HighlightBox color={isGlobal ? 'coral' : 'rescue'}>
            🐾 <strong>Věděl/a jsi?</strong> Na Zozio.cz právě hledají domov stovky zvířat. Každé sdílení může zachránit život.
          </HighlightBox>
          <CtaButton href="https://zozio.cz/adopt" color={isGlobal ? 'coral' : 'rescue'}>
            Prozkoumat zvířata k adopci
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

// ─────────────────────────────────────────────────────────────────────────────
// 14. NEWSLETTER
// ─────────────────────────────────────────────────────────────────────────────
interface NewsletterEmailProps {
  month: string
  adoptionCount: number
  releasedCount: number
  newInstitutionsCount: number
  articles: { emoji: string; label: string; labelColor?: string; title: string }[]
  animalsCount: number
  browseUrl: string
}

export function NewsletterEmail({
  month,
  adoptionCount,
  releasedCount,
  newInstitutionsCount,
  articles,
  animalsCount,
  browseUrl,
}: NewsletterEmailProps) {
  return (
    <BaseLayout previewText={`Zozio Novinky — ${month} · adopce, záchrana, příběhy`}>
      <EmailShell>
        <EmailHeader color="dark" emoji="📬" title={`Zozio Novinky\n— ${month}`} subtitle="Příběhy, zvířata, statistiky — vše důležité" />
        <EmailBody>
          <Greeting>Ahoj!</Greeting>
          <BodyText>
            Přinášíme přehled všeho, co se na Zozio.cz dělo. Děkujeme, že jste součástí komunity! 🐾
          </BodyText>
          {/* Stats */}
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '22px 0' }}>
            <tbody>
              <tr>
                {[
                  { num: adoptionCount, label: 'Adopcí tento měsíc', color: colors.coral },
                  { num: releasedCount, label: 'Zvířat propuštěno', color: colors.rescue },
                  { num: newInstitutionsCount, label: 'Nové útulky', color: colors.amber },
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
          <Divider />
          <BodyText><strong>📖 Příběhy, které stojí za přečtení</strong></BodyText>
          {/* Articles grid */}
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '16px 0 24px' }}>
            <tbody>
              {[0, 2].map(startIdx => (
                <tr key={startIdx}>
                  {articles.slice(startIdx, startIdx + 2).map((article, i) => (
                    <td key={i} style={{ width: '50%', padding: i === 0 ? '0 6px 12px 0' : '0 0 12px 6px', verticalAlign: 'top' }}>
                      <div style={{ backgroundColor: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ height: 80, backgroundColor: colors.shelterBg, textAlign: 'center', fontSize: 36, lineHeight: '80px' }}>
                          {article.emoji}
                        </div>
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: article.labelColor || colors.coral, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                            {article.label}
                          </div>
                          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 13, fontWeight: 700, color: colors.dark, lineHeight: 1.3 }}>
                            {article.title}
                          </div>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Divider />
          <HighlightBox color="coral">
            🐾 <strong>Tento měsíc hledá domov {animalsCount} zvířat</strong> na Zozio.cz. Sdílejte s přáteli — každé sdílení může zachránit život.
          </HighlightBox>
          <CtaButton href={browseUrl} color="coral">Prozkoumat zvířata k adopci</CtaButton>
        </EmailBody>
        <EmailFooter note="Zozio.cz — platforma pro útulky a záchranné stanice v ČR a SR" />
      </EmailShell>
    </BaseLayout>
  )
}
