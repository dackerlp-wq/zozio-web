import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Jednoduchý in-memory rate limit: IP -> Map<adId, timestamp>
const impressionCache = new Map<string, number>()

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/ads/[id]/track
// body: { event: 'impression' | 'click', slot: string }
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params

  let body: { event?: string; slot?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, slot } = body
  if (!event || !slot) {
    return NextResponse.json({ error: 'event and slot are required' }, { status: 400 })
  }
  if (event !== 'impression' && event !== 'click') {
    return NextResponse.json({ error: 'event must be impression or click' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Rate limit: max 1 impression per ad per IP per hour
  if (event === 'impression') {
    const cacheKey = `${ip}:${id}`
    const last = impressionCache.get(cacheKey)
    const now = Date.now()
    if (last && now - last < 60 * 60 * 1000) {
      // Throttled — vrátit 200 ale neinkrementovat
      return NextResponse.json({ throttled: true })
    }
    impressionCache.set(cacheKey, now)

    // Vyčistit starý cache občas (jednoduché)
    if (impressionCache.size > 10000) {
      const cutoff = now - 60 * 60 * 1000
      for (const [k, v] of impressionCache.entries()) {
        if (v < cutoff) impressionCache.delete(k)
      }
    }
  }

  const service = createServiceClient()
  const userAgent = req.headers.get('user-agent') ?? undefined

  // Paralelně: inkrementovat counter + přidat event
  const column = event === 'impression' ? 'impressions' : 'clicks'

  const [updateResult, insertResult] = await Promise.all([
    service.rpc('increment_ad_stat', { ad_id: id, column_name: column }).maybeSingle(),
    service.from('ad_events').insert({
      ad_id:      id,
      event_type: event,
      slot,
      user_agent: userAgent,
    }),
  ])

  // Fallback pokud RPC neexistuje — přímý update
  if (updateResult.error) {
    const { data: current } = await service
      .from('ads')
      .select(column)
      .eq('id', id)
      .single()

    if (current) {
      await service
        .from('ads')
        .update({
          [column]: (current[column as keyof typeof current] as number ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    }
  }

  if (insertResult.error) {
    console.error('[track] ad_events insert error:', insertResult.error.message)
  }

  return NextResponse.json({ success: true })
}
