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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const body = await request.json()
    if (!body.institution_id) {
      return NextResponse.json({ error: 'Chybí institution_id' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('institution_id', body.institution_id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const { data, error } = await service
      .from('rescue_cases')
      .insert(sanitizePayload(body))
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error('POST /api/rescue_cases error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
