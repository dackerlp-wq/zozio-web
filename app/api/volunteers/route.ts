import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now    = Date.now()
  const window = 60 * 60 * 1000  // 1 hodina
  const limit  = 10

  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window })
    return true
  }

  if (record.count >= limit) return false
  record.count++
  return true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Příliš mnoho žádostí. Zkus to znovu za hodinu.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    if (!body.institution_id || !body.name || !body.email) {
      return NextResponse.json({ error: 'Chybí povinná pole' }, { status: 400 })
    }

    if (!EMAIL_RE.test(body.email)) {
      return NextResponse.json({ error: 'Neplatný e-mail' }, { status: 400 })
    }

    const service = createServiceClient()

    // Zkontroluj duplicitu
    const { data: existing } = await service
      .from('volunteers')
      .select('id')
      .eq('institution_id', body.institution_id)
      .eq('email', body.email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Tento e-mail je již zaregistrován jako dobrovolník' },
        { status: 409 }
      )
    }

    const { data, error } = await service
      .from('volunteers')
      .insert({
        institution_id: body.institution_id,
        name:           body.name,
        email:          body.email,
        phone:          body.phone    || null,
        activities:     body.activities ?? [],
        message:        body.message  || null,
        status:         'pending',
      })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: data.id })

  } catch (error) {
    console.error('POST /api/volunteers error:', error)
    return NextResponse.json({ error: 'Interní chyba' }, { status: 500 })
  }
}
