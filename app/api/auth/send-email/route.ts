import { sendVerifyEmail, sendResetPasswordEmail } from '@/lib/email/send'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const { user, email_data } = JSON.parse(rawBody)
  const { token_hash, email_action_type } = email_data ?? {}

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zozio.cz'
  const next    = '/auth/reset-password'
  const confirmUrl = `${baseUrl}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&next=${encodeURIComponent(next)}`

  if (email_action_type === 'signup' || email_action_type === 'email_change') {
    await sendVerifyEmail({ to: user.email, verifyUrl: confirmUrl })
  }

  if (email_action_type === 'recovery') {
    await sendResetPasswordEmail({ to: user.email, resetUrl: confirmUrl, expiresInMinutes: 60 })
  }

  return Response.json({})
}
