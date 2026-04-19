import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { regionFromCoords } from '@/lib/region-from-coords'

const TIER_WEIGHT: Record<string, number> = {
  main:      4,
  partner:   3,
  supporter: 2,
  friend:    1,
}

// GET /api/ads?slot=inline_grid&species=uuid&lat=49.19&lng=16.60
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slot    = searchParams.get('slot')
  const species = searchParams.get('species')
  const latStr  = searchParams.get('lat')
  const lngStr  = searchParams.get('lng')

  if (!slot) {
    return NextResponse.json({ error: 'slot is required' }, { status: 400 })
  }

  // Detekce kraje z GPS (pokud jsou souřadnice k dispozici)
  let detectedRegion: string | null = null
  if (latStr && lngStr) {
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    if (!isNaN(lat) && !isNaN(lng)) {
      detectedRegion = regionFromCoords(lat, lng)
    }
  }

  const today   = new Date().toISOString().split('T')[0]
  const service = createServiceClient()

  let query = service
    .from('ads')
    .select('*')
    .eq('active', true)
    .eq('status', 'approved')
    .lte('active_from', today)
    .gte('active_to', today)
    .contains('slots', [slot])

  if (species) {
    query = query.or(`target_species.eq.${species},target_species.is.null`)
  } else {
    query = query.is('target_species', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('[ads/route] Error fetching ads:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const allAds = data ?? []

  // ── Filtrování podle regionu ────────────────────────────────────────────
  // Logika:
  //   target_regions = []   → národní reklama, zobrazí se vždy
  //   target_regions = [...] → regionální, zobrazí se jen pokud:
  //     a) je detekován region uživatele, A
  //     b) target_regions obsahuje detekovaný region
  const filtered = allAds.filter(ad => {
    const regions: string[] = ad.target_regions ?? []

    if (regions.length === 0) return true           // národní = vždy zobrazit

    if (!detectedRegion) return false               // regionální bez GPS kontextu = skrýt

    return regions.includes(detectedRegion)
  })

  // ── Seřadit dle tier váhy (main > partner > supporter > friend) ─────────
  const sorted = filtered.sort((a, b) => {
    const wa = TIER_WEIGHT[a.tier] ?? 0
    const wb = TIER_WEIGHT[b.tier] ?? 0
    return wb - wa
  })

  return NextResponse.json(sorted, {
    headers: {
      // Krátká cache — regionální reklamy závisí na GPS v URL
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
