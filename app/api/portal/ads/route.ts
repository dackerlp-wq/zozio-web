import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/portal/ads — seznam reklam firmy
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Nejprve zjistíme company_id uživatele
  const { data: company } = await supabase
    .from('ad_companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) return NextResponse.json([])

  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/portal/ads — vytvoří novou reklamu
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase
    .from('ad_companies')
    .select('id, company_name, contact_email')
    .eq('user_id', user.id)
    .single()

  if (!company) return NextResponse.json({ error: 'Company profile not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ads')
    .insert({
      company_id:     company.id,
      company_name:   company.company_name,
      contact_email:  company.contact_email,
      headline:       body.headline,
      description:    body.description    ?? null,
      cta_label:      body.cta_label      ?? 'Více info',
      cta_url:        body.cta_url,
      logo_url:       body.logo_url       ?? null,
      image_url:      body.image_url      ?? null,
      slots:          body.slots          ?? [],
      target_species: body.target_species ?? null,
      active_from:    body.active_from,
      active_to:      body.active_to,
      tier:           'supporter',        // Dan nastaví tier
      active:         false,              // aktivuje Dan po schválení
      status:         'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
