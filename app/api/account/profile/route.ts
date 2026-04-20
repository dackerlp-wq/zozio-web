import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const body = await request.json()
  const { full_name, phone } = body

  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      full_name: full_name ?? user.user_metadata?.full_name,
      phone:     phone     ?? user.user_metadata?.phone ?? null,
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
