import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const VALID_TYPES = ['vaccination', 'deworming', 'medication', 'exam', 'treatment', 'surgery', 'note'] as const

async function checkAccess(userId: string, animalId: string, service: ReturnType<typeof createServiceClient>) {
  const { data: animal } = await service
    .from('animals')
    .select('institution_id')
    .eq('id', animalId)
    .single()
  if (!animal) return null

  const { data: membership } = await service
    .from('institution_members')
    .select('role')
    .eq('user_id', userId)
    .eq('institution_id', animal.institution_id)
    .single()

  return membership ? animal : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()
  const animal = await checkAccess(user.id, id, service)
  if (!animal) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

  const { data, error } = await service
    .from('animal_medical_records')
    .select('*')
    .eq('animal_id', id)
    .order('record_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()
  const animal = await checkAccess(user.id, id, service)
  if (!animal) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

  const body = await request.json() as Record<string, unknown>
  const title = (body.title as string | undefined)?.trim()
  if (!title) return NextResponse.json({ error: 'Název záznamu je povinný' }, { status: 400 })

  const recordType = VALID_TYPES.includes(body.record_type as typeof VALID_TYPES[number])
    ? body.record_type as string
    : 'note'

  const { data: record, error } = await service
    .from('animal_medical_records')
    .insert({
      animal_id:     id,
      institution_id: animal.institution_id,
      record_date:   body.record_date || new Date().toISOString().slice(0, 10),
      record_type:   recordType,
      title,
      description:   (body.description as string | undefined) || null,
      vet_name:      (body.vet_name as string | undefined) || null,
      next_due_date: (body.next_due_date as string | undefined) || null,
      created_by:    user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Auto-sync vaccinated flag: pokud je přidán záznam vakcinace/odčervení → nastav vaccinated = true
  if (['vaccination', 'deworming'].includes(recordType)) {
    service.from('animals').update({ vaccinated: true }).eq('id', id).then(({ error: vErr }) => {
      if (vErr) console.error('vaccinated sync error:', vErr)
    })
  }

  return NextResponse.json(record, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const service = createServiceClient()
  const animal = await checkAccess(user.id, id, service)
  if (!animal) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const recordId = searchParams.get('record_id')
  if (!recordId) return NextResponse.json({ error: 'Chybí record_id' }, { status: 400 })

  const { error } = await service
    .from('animal_medical_records')
    .delete()
    .eq('id', recordId)
    .eq('animal_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
