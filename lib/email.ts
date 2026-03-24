import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'ZOZ <noreply@zozio.cz>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

// Notifikace útulku — nová žádost o adopci
export async function sendNewApplicationEmail({
  institutionEmail,
  institutionName,
  animalName,
  applicantName,
  applicantEmail,
  applicationId,
}: {
  institutionEmail: string
  institutionName: string
  animalName: string
  applicantName: string
  applicantEmail: string
  applicationId: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: institutionEmail,
      subject: `Nová žádost o adopci — ${animalName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #E8634A; margin-bottom: 8px;">Nová žádost o adopci 🐾</h2>
          <p style="color: #9B5E35; margin-bottom: 24px;">
            Dobrý den, <strong>${institutionName}</strong>!
          </p>
          <p style="color: #2C1810;">
            Obdrželi jste novou žádost o adopci zvířete <strong>${animalName}</strong>.
          </p>
          <div style="background: #FDEAE6; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #2C1810;"><strong>Žadatel:</strong> ${applicantName}</p>
            <p style="margin: 8px 0 0; color: #2C1810;"><strong>E-mail:</strong> ${applicantEmail}</p>
          </div>
          <a href="${SITE}/admin/applications/${applicationId}"
            style="display: inline-block; background: #E8634A; color: white; padding: 12px 24px; border-radius: 100px; text-decoration: none; font-weight: bold; margin-top: 8px;">
            Zobrazit žádost →
          </a>
          <p style="color: #8B7355; font-size: 13px; margin-top: 24px;">
            Zozio · zachraňme opuštěná zvířata
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('sendNewApplicationEmail error:', error)
  }
}

// Potvrzení žadateli
export async function sendApplicationConfirmationEmail({
  applicantEmail,
  applicantName,
  animalName,
  institutionName,
}: {
  applicantEmail: string
  applicantName: string
  animalName: string
  institutionName: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: applicantEmail,
      subject: `Žádost o adopci ${animalName} byla odeslána`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #E8634A; margin-bottom: 8px;">Žádost odeslána! 🎉</h2>
          <p style="color: #9B5E35; margin-bottom: 24px;">
            Dobrý den, <strong>${applicantName}</strong>!
          </p>
          <p style="color: #2C1810;">
            Vaše žádost o adopci zvířete <strong>${animalName}</strong> byla úspěšně odeslána do útulku <strong>${institutionName}</strong>.
          </p>
          <p style="color: #2C1810; margin-top: 12px;">
            Útulok Vás bude kontaktovat co nejdříve. Děkujeme, že dáváte zvířatům šanci! 🐾
          </p>
          <p style="color: #8B7355; font-size: 13px; margin-top: 32px;">
            Zozio · zachraňme opuštěná zvířata · <a href="${SITE}" style="color: #E8634A;">zozio.cz</a>
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('sendApplicationConfirmationEmail error:', error)
  }
}

// Notifikace o změně stavu žádosti
export async function sendApplicationStatusEmail({
  applicantEmail,
  applicantName,
  animalName,
  status,
}: {
  applicantEmail: string
  applicantName: string
  animalName: string
  status: string
}) {
  const statusMessages: Record<string, { subject: string; message: string; emoji: string }> = {
    approved: {
      subject: `Vaše žádost o adopci ${animalName} byla schválena!`,
      message: 'Gratulujeme! Vaše žádost o adopci byla schválena. Útulok se Vám ozve pro domluvení dalšího postupu.',
      emoji: '🎉',
    },
    rejected: {
      subject: `Žádost o adopci ${animalName}`,
      message: 'Bohužel Vaše žádost o adopci nebyla tentokrát schválena. Nevzdávejte to — podívejte se na další zvířata hledající domov.',
      emoji: '😔',
    },
    meeting_scheduled: {
      subject: `Schůzka ohledně adopce ${animalName}`,
      message: 'Útulok si přeje naplánovat schůzku. Brzy Vás budou kontaktovat s detaily.',
      emoji: '📅',
    },
  }

  const msg = statusMessages[status]
  if (!msg) return

  try {
    await resend.emails.send({
      from: FROM,
      to: applicantEmail,
      subject: msg.subject,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #E8634A; margin-bottom: 8px;">${msg.emoji} Aktualizace žádosti</h2>
          <p style="color: #9B5E35; margin-bottom: 24px;">Dobrý den, <strong>${applicantName}</strong>!</p>
          <p style="color: #2C1810;">${msg.message}</p>
          <a href="${SITE}/adopt"
            style="display: inline-block; background: #E8634A; color: white; padding: 12px 24px; border-radius: 100px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Zobrazit zvířata →
          </a>
          <p style="color: #8B7355; font-size: 13px; margin-top: 24px;">
            Zozio · zachraňme opuštěná zvířata
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('sendApplicationStatusEmail error:', error)
  }
}

// Schválení instituce superadminem
export async function sendInstitutionApprovedEmail({
  institutionEmail,
  institutionName,
}: {
  institutionEmail: string
  institutionName: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: institutionEmail,
      subject: `${institutionName} byla schválena na Zozio!`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #E8634A; margin-bottom: 8px;">Vítejte na Zozio! 🎉</h2>
          <p style="color: #2C1810;">
            Vaše instituce <strong>${institutionName}</strong> byla schválena a je nyní aktivní na Zozio.
          </p>
          <p style="color: #2C1810; margin-top: 12px;">
            Přihlaste se do admin panelu a začněte přidávat zvířata nebo záchranné případy.
          </p>
          <a href="${SITE}/auth/login"
            style="display: inline-block; background: #E8634A; color: white; padding: 12px 24px; border-radius: 100px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Přihlásit se →
          </a>
          <p style="color: #8B7355; font-size: 13px; margin-top: 24px;">
            Zozio · zachraňme zvířata · <a href="${SITE}" style="color: #E8634A;">zozio.cz</a>
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('sendInstitutionApprovedEmail error:', error)
  }
}
