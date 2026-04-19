import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/institutions?approved=true&limit=200
// Veřejný seznam institucí — používán pro výběr cílení v reklamním portálu
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const approved = searchParams.get('approved') === 'true'
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 500)

  const service = createServiceClient()

  let query = service
    .from('institutions')
    .select('id, name, city, type')
    .order('name')
    .limit(limit)

  if (approved) {
    query = query.eq('approval_status', 'approved')
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Chyba při načítání institucí' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
