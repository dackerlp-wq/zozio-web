import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') return null
  return { user, service }
}

// GET /api/superadmin/ads — všechny reklamy (i neaktivní)
export async function GET(_req: NextRequest) {
  const auth = await requireSuperadmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await auth.service
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/superadmin/ads — vytvoření nové reklamy
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('ads')
    .insert({
      company_name:   body.company_name,
      contact_email:  body.contact_email ?? null,
      logo_url:       body.logo_url ?? null,
      image_url:      body.image_url ?? null,
      headline:       body.headline,
      description:    body.description ?? null,
      cta_label:      body.cta_label ?? 'Více info',
      cta_url:        body.cta_url,
      slots:          body.slots ?? [],
      target_species: body.target_species ?? null,
      active_from:    body.active_from,
      active_to:      body.active_to,
      tier:           body.tier ?? 'supporter',
      active:         body.active ?? true,
      notes:          body.notes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
