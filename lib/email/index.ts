/**
 * Zozio Email System
 * Centrální export pro všechny email funkce.
 * Používá Resend + React renderování.
 */

export {
  sendWelcomeEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendNewApplicationEmail,
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,
  sendAdoptionRequestConfirmedEmail,
  sendAnimalAdoptedEmail,
  sendNewAnimalEmail,
  sendResetPasswordEmail,
  sendVerifyEmail,
  sendInvoiceEmail,
  sendSubscriptionExpiringEmail,
  sendOnboardingTipsEmail,
  sendNewsletterEmail,
} from './send'

// Aliasy pro zpětnou kompatibilitu s app/api/applications/route.ts
// route.ts volá: sendApplicationConfirmationEmail → mapujeme na sendAdoptionRequestConfirmedEmail
export { sendAdoptionRequestConfirmedEmail as sendApplicationConfirmationEmail } from './send'
