import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/portal/company — vrátí profil firmy aktuálního uživatele
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('ad_companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

// POST /api/portal/company — vytvoří nový profil firmy
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ad_companies')
    .insert({
      user_id:         user.id,
      company_name:    body.company_name,
      contact_name:    body.contact_name    ?? null,
      contact_email:   body.contact_email,
      phone:           body.phone           ?? null,
      website:         body.website         ?? null,
      ico:             body.ico             ?? null,
      billing_name:    body.billing_name    ?? null,
      billing_address: body.billing_address ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

// PUT /api/portal/company — update profilu firmy
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ad_companies')
    .update({
      company_name:    body.company_name,
      contact_name:    body.contact_name    ?? null,
      contact_email:   body.contact_email,
      phone:           body.phone           ?? null,
      website:         body.website         ?? null,
      ico:             body.ico             ?? null,
      billing_name:    body.billing_name    ?? null,
      billing_address: body.billing_address ?? null,
      updated_at:      new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
