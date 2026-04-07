import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Vercel Cron: every 10 minutes
// vercel.json: { "crons": [{ "path": "/api/cron/sync-darujme", "schedule": "*/10 * * * *" }] }

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  // Fetch all active fundraisers with a darujme_project_id + institution credentials
  const { data: fundraisers, error } = await service
    .from('fundraisers')
    .select(`
      id, darujme_project_id,
      institution:institutions(darujme_api_id, darujme_api_secret)
    `)
    .not('darujme_project_id', 'is', null)
    .eq('active', true)

  if (error) {
    console.error('[sync-darujme] fetch error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const results = { synced: 0, skipped: 0, errors: 0 }

  for (const f of (fundraisers ?? [])) {
    const inst = f.institution as any
    if (!inst?.darujme_api_id || !inst?.darujme_api_secret) {
      results.skipped++
      continue
    }

    try {
      const url = `https://www.darujme.cz/api/v1/project/${f.darujme_project_id}/stats` +
        `?apiId=${encodeURIComponent(inst.darujme_api_id)}` +
        `&apiSecret=${encodeURIComponent(inst.darujme_api_secret)}`

      const res  = await fetch(url, { next: { revalidate: 0 } })
      if (!res.ok) {
        console.warn(`[sync-darujme] project ${f.darujme_project_id} → HTTP ${res.status}`)
        results.errors++
        continue
      }

      const json = await res.json() as any

      // Darujme returns: { totalAmount, donorsCount, ... }
      const currentAmount  = json.totalAmount  ?? json.collected_amount ?? null
      const donorsCount    = json.donorsCount   ?? json.donors_count    ?? 0

      if (currentAmount === null) {
        console.warn(`[sync-darujme] project ${f.darujme_project_id} → unexpected response`, json)
        results.errors++
        continue
      }

      await service
        .from('fundraisers')
        .update({
          current_amount:        currentAmount,
          darujme_donors_count:  donorsCount,
          darujme_synced_at:     new Date().toISOString(),
        })
        .eq('id', f.id)

      results.synced++
    } catch (err) {
      console.error(`[sync-darujme] project ${f.darujme_project_id} error:`, err)
      results.errors++
    }
  }

  return NextResponse.json({ ok: true, ...results })
}
