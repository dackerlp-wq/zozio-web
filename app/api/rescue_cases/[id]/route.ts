import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED_COLUMNS = new Set([
  'name', 'species_id', 'case_number', 'sex', 'estimated_age', 'status',
  'health_status', 'intake_date', 'release_date', 'found_location', 'found_date',
  'found_by', 'cause_of_injury', 'diagnosis', 'treatment_notes', 'vet_name',
  'public_description', 'photos', 'primary_photo', 'published', 'institution_id',
])

function sanitizePayload(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_COLUMNS.has(key)) continue
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) continue
    payload[key] = value
  }
  return payload
}

async function checkAccess(userId: string, caseId: string, service: ReturnType<typeof createServiceClient>) {
  const { data: rc } = await service
    .from('rescue_cases')
    .select('institution_id')
    .eq('id', caseId)
    .single()

  if (!rc) return null

  const { data: membership } = await service
    .from('institution_members')
    .select('role')
    .eq('user_id', userId)
    .eq('institution_id', rc.institution_id)
    .single()

  return membership ? rc : null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()
    const rc = await checkAccess(user.id, id, service)
    if (!rc) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const raw = await request.json()
    const body = sanitizePayload(raw)
    const { error } = await service
      .from('rescue_cases')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PUT /api/rescue_cases/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()
    const rc = await checkAccess(user.id, id, service)
    if (!rc) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const { error } = await service.from('rescue_cases').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE /api/rescue_cases/[id] error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
