import { NextRequest, NextResponse } from 'next/server'
import {
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
} from '@/lib/email/send'
import { createClient } from '@/lib/supabase/server'

// POST /api/email
// Tato route je volána interně — například po schválení žádosti nebo registraci.
// Nikdy ji nevystavuj jako veřejnou bez auth.

export async function POST(request: NextRequest) {
  // Ověř, že volání přichází od superadmina nebo interního service
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { type, to, props } = body

  if (!type || !to || !props) {
    return NextResponse.json({ error: 'Missing type, to or props' }, { status: 400 })
  }

  try {
    let result

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(to, props)
        break
      case 'approval':
        result = await sendApprovalEmail(to, props)
        break
      case 'rejection':
        result = await sendRejectionEmail(to, props)
        break
      case 'new_application':
        result = await sendNewApplicationEmail(to, props)
        break
      case 'application_approved':
        result = await sendApplicationApprovedEmail(to, props)
        break
      case 'application_rejected':
        result = await sendApplicationRejectedEmail(to, props)
        break
      case 'adoption_request_confirmed':
        result = await sendAdoptionRequestConfirmedEmail(to, props)
        break
      case 'animal_adopted':
        result = await sendAnimalAdoptedEmail(to, props)
        break
      case 'new_animal':
        result = await sendNewAnimalEmail(to, props)
        break
      case 'reset_password':
        result = await sendResetPasswordEmail(to, props)
        break
      case 'verify_email':
        result = await sendVerifyEmail(to, props)
        break
      case 'invoice':
        result = await sendInvoiceEmail(to, props)
        break
      case 'subscription_expiring':
        result = await sendSubscriptionExpiringEmail(to, props)
        break
      case 'onboarding_tips':
        result = await sendOnboardingTipsEmail(to, props)
        break
      case 'newsletter':
        result = await sendNewsletterEmail(to, props)
        break
      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
