import { sendVerifyEmail, sendResetPasswordEmail } from '@/lib/email/send'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zozio.cz'

function nextForAction(type: string, userRole?: string | null): string {
  if (type === 'recovery') return '/auth/reset-password'
  if (type === 'signup' || type === 'email_change') {
    // Instituce po ověření emailu jdou na čekací stránku — admin je pustí
    // dál teprve po schválení (viz app/admin/layout.tsx a /auth/pending).
    if (userRole === 'institution_admin' || userRole === 'institution') return '/auth/pending'
    if (userRole === 'advertiser') return '/portal'
    return '/profil'
  }
  return '/'
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const { user, email_data } = JSON.parse(rawBody)
  const { token_hash, email_action_type } = email_data ?? {}

  const next = nextForAction(email_action_type, user?.user_metadata?.role)
  const confirmUrl = `${BASE}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&next=${encodeURIComponent(next)}`

  if (email_action_type === 'signup' || email_action_type === 'email_change') {
    await sendVerifyEmail({ to: user.email, verifyUrl: confirmUrl })
  }

  if (email_action_type === 'recovery') {
    await sendResetPasswordEmail({ to: user.email, resetUrl: confirmUrl, expiresInMinutes: 60 })
  }

  return Response.json({})
}
