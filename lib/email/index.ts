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
  sendNewsletterSubscribeConfirmEmail,
} from './send'

// Aliasy pro zpětnou kompatibilitu
export { sendAdoptionRequestConfirmedEmail as sendApplicationConfirmationEmail } from './send'
export { sendApplicationStatusEmail } from './send'
export { sendApplicationReviewingEmail } from './send'
