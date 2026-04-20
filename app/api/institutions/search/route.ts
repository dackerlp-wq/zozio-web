import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  const type = request.nextUrl.searchParams.get('type') // 'shelter' | null = vše

  const service = createServiceClient()

  let query = service
    .from('institutions')
    .select('id, name, slug, type, city, logo_url')
    .eq('approval_status', 'approved')
    .order('name')
    .limit(20)

  if (q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`)
  }

  if (type === 'shelter') {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Chyba při vyhledávání' }, { status: 500 })
  }

  return NextResponse.json({ institutions: data ?? [] })
}
