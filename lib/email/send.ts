import { Resend } from 'resend'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import {
  WelcomeEmail,
  ApprovalEmail,
  RejectionEmail,
  NewApplicationEmail,
  ApplicationApprovedEmail,
  ApplicationRejectedEmail,
  AdoptionRequestConfirmedEmail,
  AnimalAdoptedEmail,
  NewAnimalEmail,
  ResetPasswordEmail,
  VerifyEmail,
  InvoiceEmail,
  SubscriptionExpiringEmail,
  OnboardingTipsEmail,
  NewsletterEmail,
} from './templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Zozio <info@zozio.cz>'

function render(el: React.ReactElement): string {
  return '<!DOCTYPE html>' + renderToStaticMarkup(el)
}

// ─── 1. VÍTEJTE — po registraci instituce ────────────────────────────────────
export async function sendWelcomeEmail(props: {
  to: string
  contactName: string
  institutionName: string
  institutionType: 'shelter' | 'rescue_station'
  email: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `Vítejte v Zozio — vaše registrace byla přijata`,
    html: render(React.createElement(WelcomeEmail, props)),
  })
}

// ─── 2. SCHVÁLENÍ REGISTRACE — superadmin schválí ────────────────────────────
export async function sendApprovalEmail(props: {
  to: string
  contactName: string
  institutionName: string
  plan: string
  adminUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `✅ ${props.institutionName} byl schválen — vítejte na Zozio!`,
    html: render(React.createElement(ApprovalEmail, props)),
  })
}

// ─── 3. ZAMÍTNUTÍ REGISTRACE — superadmin zamítne ────────────────────────────
export async function sendRejectionEmail(props: {
  to: string
  contactName: string
  institutionName: string
  reason: string
  editUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `Vaše registrace ${props.institutionName} vyžaduje doplnění`,
    html: render(React.createElement(RejectionEmail, props)),
  })
}

// ─── 4. NOVÁ ADOPČNÍ ŽÁDOST — notifikace pro správce útulku ─────────────────
// Toto volá app/api/applications/route.ts
export async function sendNewApplicationEmail(props: {
  institutionEmail: string
  institutionName: string
  animalName: string
  applicantName: string
  applicantEmail: string
  applicationId: string
  applicantPhone?: string
  applicantCity?: string
  applicantHasOtherAnimals?: boolean
  animalEmoji?: string
  animalSpecies?: string
  animalAge?: string
  applicationMessage?: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.institutionEmail,
    subject: `📩 Nová adopční žádost o ${props.animalName} od ${props.applicantName}`,
    html: render(React.createElement(NewApplicationEmail, {
      institutionContactName: props.institutionName,
      applicantName: props.applicantName,
      applicantEmail: props.applicantEmail,
      applicantPhone: props.applicantPhone ?? 'neuvedeno',
      applicantCity: props.applicantCity ?? 'neuvedeno',
      applicantHasOtherAnimals: props.applicantHasOtherAnimals ?? false,
      animalName: props.animalName,
      animalEmoji: props.animalEmoji ?? '🐾',
      animalSpecies: props.animalSpecies ?? 'zvíře',
      animalAge: props.animalAge ?? 'neuvedeno',
      applicationId: props.applicationId,
      applicationMessage: props.applicationMessage ?? '',
      adminUrl: `https://zozio.cz/admin/applications/${props.applicationId}`,
    })),
  })
}

// ─── 5. POTVRZENÍ ŽÁDOSTI — email pro žadatele po odeslání ──────────────────
// Alias: sendApplicationConfirmationEmail (viz lib/email/index.ts)
export async function sendAdoptionRequestConfirmedEmail(props: {
  applicantEmail: string
  applicantName: string
  animalName: string
  institutionName: string
  animalEmoji?: string
  animalSpecies?: string
  animalAge?: string
  applicationId?: string
  trackUrl?: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.applicantEmail,
    subject: `📬 Vaše žádost o adopci ${props.animalName} byla přijata!`,
    html: render(React.createElement(AdoptionRequestConfirmedEmail, {
      applicantName: props.applicantName,
      animalName: props.animalName,
      animalEmoji: props.animalEmoji ?? '🐾',
      animalSpecies: props.animalSpecies ?? 'zvíře',
      animalAge: props.animalAge ?? '',
      institutionName: props.institutionName,
      applicationId: props.applicationId ?? '',
      trackUrl: props.trackUrl ?? 'https://zozio.cz/moje-zadosti',
    })),
  })
}

// ─── 6A. ŽÁDOST SCHVÁLENA — email pro žadatele ───────────────────────────────
export async function sendApplicationApprovedEmail(props: {
  to: string
  applicantName: string
  animalName: string
  animalEmoji?: string
  institutionName: string
  institutionContactName: string
  institutionPhone: string
  institutionEmail: string
  adoptionFee: string
  applicationId: string
  detailUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `🎊 Vaše žádost o adopci ${props.animalName} byla schválena!`,
    html: render(React.createElement(ApplicationApprovedEmail, {
      ...props,
      animalEmoji: props.animalEmoji ?? '🐾',
    })),
  })
}

// ─── 6B. ŽÁDOST ZAMÍTNUTA — email pro žadatele ───────────────────────────────
export async function sendApplicationRejectedEmail(props: {
  to: string
  applicantName: string
  animalName: string
  institutionName: string
  institutionMessage?: string
  browseUrl?: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `Zpráva ohledně vaší žádosti o adopci — Zozio`,
    html: render(React.createElement(ApplicationRejectedEmail, {
      ...props,
      browseUrl: props.browseUrl ?? 'https://zozio.cz/adopt',
    })),
  })
}

// ─── 7. ADOPCE DOKONČENA — email pro nového majitele ─────────────────────────
export async function sendAnimalAdoptedEmail(props: {
  to: string
  adoptorName: string
  animalName: string
  animalEmoji?: string
  institutionName: string
  shareUrl?: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `🏡 Gratulujeme! ${props.animalName} má nový domov!`,
    html: render(React.createElement(AnimalAdoptedEmail, {
      ...props,
      animalEmoji: props.animalEmoji ?? '🐾',
      shareUrl: props.shareUrl ?? 'https://zozio.cz',
    })),
  })
}

// ─── 8. NOVÉ ZVÍŘE — notifikace pro odběratele ───────────────────────────────
export async function sendNewAnimalEmail(props: {
  to: string | string[]
  animalName: string
  animalEmoji?: string
  animalSpecies: string
  animalAge: string
  animalSize?: string
  animalDescription: string
  institutionName: string
  adoptionFee: string
  animalUrl: string
  browseUrl?: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `🐾 ${props.animalName} hledá domov — ${props.institutionName}`,
    html: render(React.createElement(NewAnimalEmail, {
      ...props,
      animalEmoji: props.animalEmoji ?? '🐾',
      browseUrl: props.browseUrl ?? 'https://zozio.cz/adopt',
    })),
  })
}

// ─── 9. RESET HESLA ──────────────────────────────────────────────────────────
export async function sendResetPasswordEmail(props: {
  to: string
  resetUrl: string
  expiresInMinutes?: number
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `Obnova hesla Zozio`,
    html: render(React.createElement(ResetPasswordEmail, props)),
  })
}

// ─── 10. POTVRZENÍ EMAILU ────────────────────────────────────────────────────
export async function sendVerifyEmail(props: {
  to: string
  verifyUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `Ověřte svůj e-mail — Zozio`,
    html: render(React.createElement(VerifyEmail, { verifyUrl: props.verifyUrl })),
  })
}

// ─── 11. FAKTURA ─────────────────────────────────────────────────────────────
export async function sendInvoiceEmail(props: {
  to: string
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
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `Faktura ${props.invoiceNumber} — ${props.totalPrice} · Zozio`,
    html: render(React.createElement(InvoiceEmail, props)),
  })
}

// ─── 12. EXPIRACE PŘEDPLATNÉHO ───────────────────────────────────────────────
export async function sendSubscriptionExpiringEmail(props: {
  to: string
  contactName: string
  institutionName: string
  planName: string
  expiresDate: string
  daysLeft: number
  renewUrl: string
  upgradeUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `⏰ Předplatné Zozio vyprší za ${props.daysLeft} dní`,
    html: render(React.createElement(SubscriptionExpiringEmail, props)),
  })
}

// ─── 13. ONBOARDING TIPY ─────────────────────────────────────────────────────
export async function sendOnboardingTipsEmail(props: {
  to: string
  contactName: string
  institutionName: string
  hasProfilePhoto: boolean
  hasDescription: boolean
  hasSocialLinks: boolean
  animalCount: number
  completeProfileUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `🚀 Jak vytěžit z Zozio maximum — tipy pro váš útulek`,
    html: render(React.createElement(OnboardingTipsEmail, props)),
  })
}

// ─── 14. NEWSLETTER ──────────────────────────────────────────────────────────
export async function sendNewsletterEmail(props: {
  to: string | string[]
  month: string
  adoptionCount: number
  releasedCount: number
  newInstitutionsCount: number
  articles: { emoji: string; label: string; labelColor?: string; title: string }[]
  animalsCount: number
  browseUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `🐾 Zozio Novinky — ${props.month}`,
    html: render(React.createElement(NewsletterEmail, props)),
  })
}
