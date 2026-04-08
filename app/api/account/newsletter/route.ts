import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { randomUUID } from 'crypto'

// GET — zjistí stav přihlášení k newsletteru
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()
  const { data } = await service
    .from('newsletter_subscribers')
    .select('id')
    .eq('email', user.email!)
    .is('institution_id', null)
    .maybeSingle()

  return NextResponse.json({ subscribed: !!data })
}

// POST — přihlásí k newsletteru
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()
  const name = user.user_metadata?.full_name ?? null

  const { error } = await service
    .from('newsletter_subscribers')
    .upsert(
      { email: user.email!, name, institution_id: null, unsubscribe_token: randomUUID() },
      { onConflict: 'email,institution_id', ignoreDuplicates: true }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// DELETE — odhlásí z newsletteru
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()
  await service
    .from('newsletter_subscribers')
    .delete()
    .eq('email', user.email!)
    .is('institution_id', null)

  return NextResponse.json({ success: true })
}
