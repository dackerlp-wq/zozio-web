import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public anon client — RLS ensures only published data is accessible
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

interface RouteParams {
  params: Promise<{ slug: string }>
}

function computeAge(birthYear: number | null, birthMonth: number | null) {
  if (!birthYear) return { age_years: null, age_months: null }
  const now = new Date()
  const years = now.getFullYear() - birthYear
  const months = years * 12 + (now.getMonth() - (birthMonth ?? 0))
  return { age_years: years, age_months: months < 0 ? 0 : months }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  const { searchParams } = request.nextUrl
  const type    = searchParams.get('type') === 'adopted' ? 'adopted' : 'adopt'
  const limit   = Math.min(parseInt(searchParams.get('limit') ?? '6', 10), 24) || 6
  const species = searchParams.get('species') ?? null

  // Find institution
  const { data: institution, error: instErr } = await supabase
    .from('institutions')
    .select('id, name, slug, type')
    .eq('slug', slug)
    .eq('approval_status', 'approved')
    .single()

  if (instErr || !institution) {
    return NextResponse.json(
      { error: 'Instituce nenalezena nebo není schválena' },
      { status: 404, headers: CORS }
    )
  }

  // Build animals query
  let query = supabase
    .from('animals')
    .select(`
      id, name, slug, breed,
      birth_year, birth_month,
      sex, adoption_status,
      found_date, found_location, adopted_at,
      primary_photo, description,
      species:animal_species (name_cs, name_en, icon)
    `)
    .eq('institution_id', institution.id)
    .eq('published', true)

  if (type === 'adopt') {
    query = query.in('adoption_status', ['available', 'reserved']).order('created_at', { ascending: false })
  } else {
    query = query.eq('adoption_status', 'adopted').order('adopted_at', { ascending: false })
  }

  if (species) {
    // species param is a species name_cs or icon match — filter via join
    query = (query as any).ilike('species.name_cs', `%${species}%`)
  }

  const { data: animals, error: animErr, count } = await query.limit(limit)

  if (animErr) {
    console.error('Widget API animals error:', animErr)
    return NextResponse.json({ error: 'Chyba při načítání dat' }, { status: 500, headers: CORS })
  }

  const items = (animals ?? []).map((a: any) => {
    const { age_years, age_months } = computeAge(a.birth_year, a.birth_month)
    return {
      id:               a.id,
      name:             a.name,
      slug:             a.slug,
      species:          a.species?.name_cs ?? null,
      species_icon:     a.species?.icon ?? null,
      breed:            a.breed ?? null,
      age_years,
      age_months,
      gender:           a.sex,
      status:           a.adoption_status,
      found_date:       a.found_date ?? null,
      found_location:   a.found_location ?? null,
      adopted_at:       a.adopted_at ?? null,
      primary_photo_url: a.primary_photo ?? null,
      short_description: a.description
        ? (a.description as string).slice(0, 150).trimEnd()
        : null,
    }
  })

  const body = JSON.stringify({
    institution: { name: institution.name, slug: institution.slug },
    type,
    animals: items,
    total:   count ?? items.length,
  })

  return new NextResponse(body, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type':  'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
