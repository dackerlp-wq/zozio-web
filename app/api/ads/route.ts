import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { regionFromCoords } from '@/lib/region-from-coords'

const TIER_WEIGHT: Record<string, number> = {
  main:      40,
  partner:   30,
  supporter: 20,
  friend:    10,
}

// GET /api/ads?slot=inline_grid&species=uuid&lat=49.19&lng=16.60&institutionId=uuid&articleCategory=story
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slot              = searchParams.get('slot')
  const species           = searchParams.get('species')
  const latStr            = searchParams.get('lat')
  const lngStr            = searchParams.get('lng')
  const institutionId     = searchParams.get('institutionId')
  const articleCategory   = searchParams.get('articleCategory')

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

  // ── Skórovací systém (boost, ne filtr) ────────────────────────────────────
  // Základ:  TIER_WEIGHT[tier]        (40 / 30 / 20 / 10)
  // Bonusy:
  //   +15  → lokalita se shoduje (target_regions obsahuje detekovaný kraj)
  //   +10  → konkrétní útulek se shoduje (target_institutions obsahuje institutionId)
  //   +8   → kategorie článku se shoduje (target_article_categories obsahuje articleCategory)
  //
  // Reklamy s prázdnými targeting poli jsou "národní" a nezískávají bonus,
  // ale NEJSOU filtrovány pryč — zobrazí se vždy, jen s nižší prioritou.
  const scored = allAds.map(ad => {
    let score = TIER_WEIGHT[ad.tier] ?? 10

    // Region bonus
    const targetRegions: string[] = ad.target_regions ?? []
    if (targetRegions.length > 0 && detectedRegion && targetRegions.includes(detectedRegion)) {
      score += 15
    }

    // Institution bonus
    const targetInstitutions: string[] = ad.target_institutions ?? []
    if (targetInstitutions.length > 0 && institutionId && targetInstitutions.includes(institutionId)) {
      score += 10
    }

    // Article category bonus
    const targetCategories: string[] = ad.target_article_categories ?? []
    if (targetCategories.length > 0 && articleCategory && targetCategories.includes(articleCategory)) {
      score += 8
    }

    return { ad, score }
  })

  // Seřadit sestupně dle skóre, při shodě náhodně (fair rotation)
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5)

  const sorted = scored.map(({ ad }) => ad)

  return NextResponse.json(sorted, {
    headers: {
      // Krátká cache — skóre závisí na URL parametrech
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
