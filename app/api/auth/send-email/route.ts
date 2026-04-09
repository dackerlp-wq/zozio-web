import { sendVerifyEmail, sendResetPasswordEmail } from '@/lib/email/send'

// Standard Webhooks verifikace (https://www.standardwebhooks.com/)
// Supabase podepisuje: "${webhook-id}.${webhook-timestamp}.${body}"
async function verifySignature(rawBody: string, req: Request, secret: string): Promise<boolean> {
  const webhookId        = req.headers.get('webhook-id')
  const webhookTimestamp = req.headers.get('webhook-timestamp')
  const webhookSignature = req.headers.get('webhook-signature')

  if (!webhookId || !webhookTimestamp || !webhookSignature) return false

  // Dekóduj secret: "v1,whsec_<base64>"
  const secretBase64 = secret.replace(/^v1,whsec_/, '')
  const secretBytes  = Buffer.from(secretBase64, 'base64')

  const key = await crypto.subtle.importKey(
    'raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`
  const signature     = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent))
  const computed      = `v1,${Buffer.from(signature).toString('base64')}`

  // Header může obsahovat více podpisů oddělených mezerou
  return webhookSignature.split(' ').some(s => s === computed)
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const secret = process.env.SUPABASE_HOOK_SECRET
  if (secret) {
    const valid = await verifySignature(rawBody, request, secret)
    if (!valid) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const { user, email_data } = JSON.parse(rawBody)
  const { token_hash, email_action_type, redirect_to, site_url } = email_data ?? {}

  const baseUrl    = site_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://zozio.cz'
  const next       = redirect_to || '/'
  const confirmUrl = `${baseUrl}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&next=${encodeURIComponent(next)}`

  if (email_action_type === 'signup' || email_action_type === 'email_change') {
    await sendVerifyEmail({ to: user.email, verifyUrl: confirmUrl })
  }

  if (email_action_type === 'recovery') {
    await sendResetPasswordEmail({ to: user.email, resetUrl: confirmUrl, expiresInMinutes: 60 })
  }

  return Response.json({})
}
