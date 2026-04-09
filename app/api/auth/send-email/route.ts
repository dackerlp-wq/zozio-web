import { sendVerifyEmail, sendResetPasswordEmail } from '@/lib/email/send'

// Ověří HMAC-SHA256 podpis od Supabase (formát: v1,whsec_XXX)
async function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader) return false

  // secret = "v1,whsec_<base64>"
  const whsecPart = secret.split(',')[1]?.replace('whsec_', '')
  if (!whsecPart) return false

  const secretBytes = Uint8Array.from(Buffer.from(whsecPart, 'base64'))

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(rawBody),
  )

  const computed = `v1=${Buffer.from(signature).toString('hex')}`
  return computed === signatureHeader
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const secret = process.env.SUPABASE_HOOK_SECRET
  if (secret) {
    const signatureHeader = request.headers.get('x-supabase-signature')
    const valid = await verifySignature(rawBody, signatureHeader, secret)
    if (!valid) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const { user, email_data } = JSON.parse(rawBody)

  const { token_hash, email_action_type, redirect_to, site_url } = email_data ?? {}

  const baseUrl = site_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://zozio.cz'
  const next = redirect_to || '/'

  const confirmUrl =
    `${baseUrl}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&next=${encodeURIComponent(next)}`

  if (email_action_type === 'signup' || email_action_type === 'email_change') {
    await sendVerifyEmail({ to: user.email, verifyUrl: confirmUrl })
  }

  if (email_action_type === 'recovery') {
    await sendResetPasswordEmail({ to: user.email, resetUrl: confirmUrl, expiresInMinutes: 60 })
  }

  return Response.json({})
}
