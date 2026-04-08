'server-only'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import * as React from 'react'
import {
  WelcomeEmail,
  ApprovalEmail,
  RejectionEmail,
  NewApplicationEmail,
  ApplicationReviewingEmail,
  ApplicationApprovedEmail,
  ApplicationRejectedEmail,
  MeetingScheduledEmail,
  MeetingConfirmedEmail,
  AdoptionRequestConfirmedEmail,
  AnimalAdoptedEmail,
  NewAnimalEmail,
  ResetPasswordEmail,
  VerifyEmail,
  InvoiceEmail,
  SubscriptionExpiringEmail,
  OnboardingTipsEmail,
  NewsletterEmail,
  NewsletterSubscribeConfirmEmail,
} from './templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Zozio <info@zozio.cz>'

// ─── 1. VÍTEJTE ──────────────────────────────────────────────────────────────
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
    html: await render(React.createElement(WelcomeEmail, props)),
  })
}

// ─── 2. SCHVÁLENÍ REGISTRACE ─────────────────────────────────────────────────
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
    html: await render(React.createElement(ApprovalEmail, props)),
  })
}

// ─── 3. ZAMÍTNUTÍ REGISTRACE ─────────────────────────────────────────────────
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
    html: await render(React.createElement(RejectionEmail, props)),
  })
}

// ─── 4. NOVÁ ADOPČNÍ ŽÁDOST — pro správce ────────────────────────────────────
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
    html: await render(React.createElement(NewApplicationEmail, {
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

// ─── 5. POTVRZENÍ ŽÁDOSTI — pro žadatele ─────────────────────────────────────
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
  animalPhotoUrl?: string
  cancelToken?: string
}) {
  const cancelUrl = props.cancelToken && props.applicationId
    ? `https://zozio.cz/adopce/zrusit?id=${props.applicationId}&token=${props.cancelToken}`
    : undefined

  return resend.emails.send({
    from: FROM,
    to: props.applicantEmail,
    subject: `📬 Vaše žádost o adopci ${props.animalName} byla přijata!`,
    html: await render(React.createElement(AdoptionRequestConfirmedEmail, {
      applicantName:  props.applicantName,
      animalName:     props.animalName,
      animalEmoji:    props.animalEmoji ?? '🐾',
      animalSpecies:  props.animalSpecies ?? 'zvíře',
      animalAge:      props.animalAge ?? '',
      institutionName: props.institutionName,
      applicationId:  props.applicationId ?? '',
      trackUrl:       props.trackUrl ?? 'https://zozio.cz/profil?tab=applications',
      animalPhotoUrl: props.animalPhotoUrl,
      cancelUrl,
    })),
  })
}

// ─── 5D. TERMÍN POTVRZEN — pro útulek ────────────────────────────────────────
export async function sendMeetingConfirmedEmail(props: {
  to: string
  institutionContactName: string
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  animalName: string
  animalEmoji?: string
  confirmedDate: string
  applicationId: string
}) {
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `✅ Termín schůzky potvrzen — ${props.applicantName} / ${props.animalName}`,
    html: await render(React.createElement(MeetingConfirmedEmail, {
      institutionContactName: props.institutionContactName,
      applicantName:          props.applicantName,
      applicantEmail:         props.applicantEmail,
      applicantPhone:         props.applicantPhone,
      animalName:             props.animalName,
      animalEmoji:            props.animalEmoji ?? '🐾',
      confirmedDate:          props.confirmedDate,
      applicationId:          props.applicationId,
      adminUrl:               `https://zozio.cz/admin/applications/${props.applicationId}`,
    })),
  })
}

// ─── 6A. ŽÁDOST SCHVÁLENA — pro žadatele ─────────────────────────────────────
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
    html: await render(React.createElement(ApplicationApprovedEmail, {
      ...props,
      animalEmoji: props.animalEmoji ?? '🐾',
    })),
  })
}

// ─── 6B. ŽÁDOST ZAMÍTNUTA — pro žadatele ─────────────────────────────────────
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
    html: await render(React.createElement(ApplicationRejectedEmail, {
      ...props,
      browseUrl: props.browseUrl ?? 'https://zozio.cz/adopt',
    })),
  })
}

// ─── 7. ADOPCE DOKONČENA ──────────────────────────────────────────────────────
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
    html: await render(React.createElement(AnimalAdoptedEmail, {
      ...props,
      animalEmoji: props.animalEmoji ?? '🐾',
      shareUrl: props.shareUrl ?? 'https://zozio.cz',
    })),
  })
}

// ─── 8. NOVÉ ZVÍŘE — notifikace ──────────────────────────────────────────────
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
    html: await render(React.createElement(NewAnimalEmail, {
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
    html: await render(React.createElement(ResetPasswordEmail, props)),
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
    html: await render(React.createElement(VerifyEmail, { verifyUrl: props.verifyUrl })),
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
    html: await render(React.createElement(InvoiceEmail, props)),
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
    html: await render(React.createElement(SubscriptionExpiringEmail, props)),
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
    html: await render(React.createElement(OnboardingTipsEmail, props)),
  })
}

// ─── 6X. ŽÁDOST SE POSUZUJE (reviewing) ─────────────────────────────────────
export async function sendApplicationReviewingEmail(props: {
  to: string
  applicantName: string
  animalName: string
  animalEmoji?: string
  institutionName: string
  applicationId: string
  detailUrl?: string
  institutionNote?: string
  cancelToken?: string
}) {
  const cancelUrl = props.cancelToken && props.applicationId
    ? `https://zozio.cz/adopce/zrusit?id=${props.applicationId}&token=${props.cancelToken}`
    : undefined

  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `🔍 Vaše žádost o adopci ${props.animalName} se posuzuje`,
    html: await render(React.createElement(ApplicationReviewingEmail, {
      applicantName:   props.applicantName,
      animalName:      props.animalName,
      animalEmoji:     props.animalEmoji ?? '🐾',
      institutionName: props.institutionName,
      applicationId:   props.applicationId,
      detailUrl:       props.detailUrl ?? 'https://zozio.cz/profil?tab=applications',
      institutionNote: props.institutionNote,
      cancelUrl,
    })),
  })
}

// ─── ALIAS: sendApplicationStatusEmail ───────────────────────────────────────
// Volá app/api/applications/[id]/status/route.ts
// Mapuje status na správný email template
export async function sendApplicationStatusEmail(props: {
  applicantEmail: string
  applicantName: string
  animalName: string
  animalEmoji?: string
  animalPhotoUrl?: string
  status: 'reviewing' | 'approved' | 'rejected' | 'meeting_scheduled' | 'adopted' | string
  institutionName?: string
  institutionPhone?: string
  institutionEmail?: string
  adoptionFee?: string
  applicationId?: string
  detailUrl?: string
  institutionNote?: string
  meetingOptions?: string[]
  meetingAt?: string
  cancelToken?: string
}) {
  const cancelUrl = props.cancelToken && props.applicationId
    ? `https://zozio.cz/adopce/zrusit?id=${props.applicationId}&token=${props.cancelToken}`
    : undefined
  const confirmBaseUrl = props.cancelToken && props.applicationId
    ? `https://zozio.cz/adopce/potvrdit-schuezku?id=${props.applicationId}&token=${props.cancelToken}&option=`
    : undefined

  if (props.status === 'reviewing') {
    return resend.emails.send({
      from: FROM,
      to: props.applicantEmail,
      subject: `🔍 Vaše žádost o adopci ${props.animalName} se posuzuje`,
      html: await render(React.createElement(ApplicationReviewingEmail, {
        applicantName:   props.applicantName,
        animalName:      props.animalName,
        animalEmoji:     props.animalEmoji ?? '🐾',
        institutionName: props.institutionName ?? '',
        applicationId:   props.applicationId ?? '',
        detailUrl:       props.detailUrl ?? 'https://zozio.cz/profil?tab=applications',
        institutionNote: props.institutionNote,
        cancelUrl,
      })),
    })
  }

  if (props.status === 'meeting_scheduled') {
    return resend.emails.send({
      from: FROM,
      to: props.applicantEmail,
      subject: `📅 Schůzka naplánována — adopce ${props.animalName}`,
      html: await render(React.createElement(MeetingScheduledEmail, {
        applicantName:    props.applicantName,
        animalName:       props.animalName,
        animalEmoji:      props.animalEmoji ?? '🐾',
        institutionName:  props.institutionName ?? '',
        institutionPhone: props.institutionPhone ?? '',
        institutionEmail: props.institutionEmail ?? '',
        meetingOptions:   props.meetingOptions ?? [],
        meetingAt:        props.meetingAt,
        applicationId:    props.applicationId ?? '',
        institutionNote:  props.institutionNote,
        detailUrl:        props.detailUrl ?? 'https://zozio.cz/profil?tab=applications',
        confirmBaseUrl,
        cancelUrl,
      })),
    })
  }

  if (props.status === 'approved') {
    return resend.emails.send({
      from: FROM,
      to: props.applicantEmail,
      subject: `🎊 Vaše žádost o adopci ${props.animalName} byla schválena!`,
      html: await render(React.createElement(ApplicationApprovedEmail, {
        applicantName:          props.applicantName,
        animalName:             props.animalName,
        animalEmoji:            props.animalEmoji ?? '🐾',
        institutionName:        props.institutionName ?? '',
        institutionContactName: props.institutionName ?? '',
        institutionPhone:       props.institutionPhone ?? '',
        institutionEmail:       props.institutionEmail ?? '',
        adoptionFee:            props.adoptionFee ?? '',
        applicationId:          props.applicationId ?? '',
        detailUrl:              props.detailUrl ?? 'https://zozio.cz/profil?tab=applications',
      })),
    })
  }

  if (props.status === 'rejected') {
    return resend.emails.send({
      from: FROM,
      to: props.applicantEmail,
      subject: `Zpráva ohledně vaší žádosti o adopci — Zozio`,
      html: await render(React.createElement(ApplicationRejectedEmail, {
        applicantName:      props.applicantName,
        animalName:         props.animalName,
        institutionName:    props.institutionName ?? '',
        institutionMessage: props.institutionNote,
        browseUrl:          'https://zozio.cz/adopt',
      })),
    })
  }
}

// ─── 15. POTVRZENÍ ODBĚRU NEWSLETTERU ────────────────────────────────────────
export async function sendNewsletterSubscribeConfirmEmail(props: {
  to: string
  name?: string
  institutionName?: string
  unsubscribeUrl: string
}) {
  const isGlobal = !props.institutionName
  return resend.emails.send({
    from: FROM,
    to: props.to,
    subject: isGlobal
      ? `📬 Jsi přihlášen/a k odběru Zozio novinek`
      : `📬 Odběr novinek od ${props.institutionName} potvrzen`,
    html: await render(React.createElement(NewsletterSubscribeConfirmEmail, {
      name: props.name,
      institutionName: props.institutionName,
      unsubscribeUrl: props.unsubscribeUrl,
    })),
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
    html: await render(React.createElement(NewsletterEmail, props)),
  })
}
