import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/ads/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const service = createServiceClient()

  const { data, error } = await service
    .from('ads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PUT /api/ads/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { data, error } = await service
    .from('ads')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE /api/ads/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await service.from('ads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
