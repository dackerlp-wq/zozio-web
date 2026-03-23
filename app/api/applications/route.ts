import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validace povinných polí
    if (!body.animal_id || !body.applicant_name || !body.applicant_email || !body.motivation) {
      return NextResponse.json(
        { error: 'Chybí povinná pole (jméno, e-mail, motivace)' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Ověř že zvíře existuje a je dostupné
    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .select('id, institution_id, adoption_status, name')
      .eq('id', body.animal_id)
      .single()

    if (animalError || !animal) {
      return NextResponse.json({ error: 'Zvíře nenalezeno' }, { status: 404 })
    }

    if (animal.adoption_status !== 'available') {
      return NextResponse.json(
        { error: `${animal.name} již není dostupný k adopci` },
        { status: 409 }
      )
    }

    // Zkontroluj duplicitní žádost
    const { data: existing } = await supabase
      .from('adoption_applications')
      .select('id')
      .eq('animal_id', body.animal_id)
      .eq('applicant_email', body.applicant_email)
      .in('status', ['pending', 'reviewing', 'approved'])
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Na toto zvíře jsi již žádost podal/a' },
        { status: 409 }
      )
    }

    // Vytvoř žádost
    const { data, error } = await supabase
      .from('adoption_applications')
      .insert({
        animal_id:       body.animal_id,
        institution_id:  animal.institution_id,
        applicant_name:  body.applicant_name,
        applicant_email: body.applicant_email,
        applicant_phone: body.applicant_phone ?? null,
        housing_type:    body.housing_type ?? null,
        has_garden:      body.has_garden ?? null,
        has_children:    body.has_children ?? null,
        children_ages:   body.children_ages ?? null,
        other_pets:      body.other_pets ?? null,
        experience:      body.experience ?? null,
        motivation:      body.motivation,
        status:          'pending',
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error('POST /api/applications error:', error)
    return NextResponse.json(
      { error: 'Interní chyba serveru' },
      { status: 500 }
    )
  }
}
