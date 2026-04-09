import { sendVerifyEmail, sendResetPasswordEmail } from '@/lib/email/send'

// Supabase Auth Hook — Send Email
// Nastavit v Supabase: Authentication → Hooks → Send Email → HTTP Request
// URL: https://zozio.cz/api/auth/send-email
// Secret: SUPABASE_HOOK_SECRET (přidat do Vercel env vars)

export async function POST(request: Request) {
  // Ověř tajný klíč
  const secret = process.env.SUPABASE_HOOK_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const body = await request.json()
  const { user, email_data } = body

  const {
    token_hash,
    email_action_type,
    redirect_to,
    site_url,
  } = email_data ?? {}

  const baseUrl = site_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://zozio.cz'
  const next = redirect_to || '/'

  const confirmUrl =
    `${baseUrl}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&next=${encodeURIComponent(next)}`

  if (email_action_type === 'signup' || email_action_type === 'email_change') {
    await sendVerifyEmail({
      to: user.email,
      verifyUrl: confirmUrl,
    })
  }

  if (email_action_type === 'recovery') {
    await sendResetPasswordEmail({
      to: user.email,
      resetUrl: confirmUrl,
      expiresInMinutes: 60,
    })
  }

  // Supabase očekává prázdný JSON objekt jako odpověď
  return Response.json({})
}
