import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const TIER_WEIGHT: Record<string, number> = {
  main:      4,
  partner:   3,
  supporter: 2,
  friend:    1,
}

// GET /api/ads?slot=inline_grid&species=uuid
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slot    = searchParams.get('slot')
  const species = searchParams.get('species')

  if (!slot) {
    return NextResponse.json({ error: 'slot is required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const service = createServiceClient()

  let query = service
    .from('ads')
    .select('*')
    .eq('active', true)
    .lte('active_from', today)
    .gte('active_to', today)
    .contains('slots', [slot])

  if (species) {
    // Vrátit reklamy cílené na dané species NEBO bez cílení (null)
    query = query.or(`target_species.eq.${species},target_species.is.null`)
  } else {
    query = query.is('target_species', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('[ads/route] Error fetching ads:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Seřadit dle tier váhy (main > partner > supporter > friend)
  const sorted = (data ?? []).sort((a, b) => {
    const wa = TIER_WEIGHT[a.tier] ?? 0
    const wb = TIER_WEIGHT[b.tier] ?? 0
    return wb - wa
  })

  return NextResponse.json(sorted, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
