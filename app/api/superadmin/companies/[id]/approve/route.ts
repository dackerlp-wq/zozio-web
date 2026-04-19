import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface Params {
  params: Promise<{ id: string }>
}

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

// POST /api/superadmin/companies/[id]/approve
// body: { approved: boolean }
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const auth = await requireSuperadmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { approved: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data, error } = await auth.service
    .from('ad_companies')
    .update({ approved: body.approved, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
