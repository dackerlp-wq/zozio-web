import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendNewsletterSubscribeConfirmEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, institution_id } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Neplatný e-mail' }, { status: 400 })
    }

    const service = createServiceClient()

    // Resolve institution name if subscribing to institution newsletter
    let institutionName: string | undefined
    if (institution_id) {
      const { data: inst } = await service
        .from('institutions')
        .select('name')
        .eq('id', institution_id)
        .single()
      institutionName = inst?.name
    }

    const unsubscribeToken = randomUUID()

    // Upsert — pokud už existuje, nic se nestane (ON CONFLICT DO NOTHING)
    const { error } = await service
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          name: name || null,
          institution_id: institution_id || null,
          unsubscribe_token: unsubscribeToken,
        },
        { onConflict: 'email,institution_id', ignoreDuplicates: true }
      )

    if (error) throw error

    // Fetch the actual token (may differ if record already existed)
    const { data: subscriber } = await service
      .from('newsletter_subscribers')
      .select('unsubscribe_token')
      .eq('email', email)
      .eq('institution_id', institution_id ?? null)
      .single()

    const token = subscriber?.unsubscribe_token ?? unsubscribeToken
    const unsubscribeUrl = `https://zozio.cz/api/newsletter/unsubscribe?token=${token}`

    // Odeslat potvrzovací email (fire-and-forget — chyba nevadí)
    sendNewsletterSubscribeConfirmEmail({
      to: email,
      name: name || undefined,
      institutionName,
      unsubscribeUrl,
    }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/newsletter/subscribe error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
