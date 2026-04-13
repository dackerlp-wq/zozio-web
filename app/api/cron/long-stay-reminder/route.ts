import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Spouštěj přes Vercel Cron — každé pondělí ráno
// vercel.json:
// {
//   "crons": [{ "path": "/api/cron/long-stay-reminder", "schedule": "0 8 * * 1" }]
// }

export async function GET(request: NextRequest) {
  // Ověř Vercel cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const thresholdDays = 90
  const threshold = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Najdi institucí s dlouhodobě ubytovanými zvířaty
  const { data: longStayAnimals } = await service
    .from('animals')
    .select('id, name, intake_date, institution:institutions(id, name, email)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .lt('intake_date', threshold)

  if (!longStayAnimals?.length) {
    return NextResponse.json({ message: 'Žádná dlouhodobě ubytovaná zvířata' })
  }

  // Seskup podle instituce
  interface LongStayInstitution { id: string; name: string; email: string }
  interface LongStayAnimal { id: string; name: string; intake_date: string }
  const byInstitution = new Map<string, { inst: LongStayInstitution; animals: LongStayAnimal[] }>()

  for (const animal of longStayAnimals) {
    const inst = animal.institution as unknown as LongStayInstitution | null
    if (!inst?.email) continue

    const key = inst.id
    if (!byInstitution.has(key)) {
      byInstitution.set(key, { inst, animals: [] })
    }
    byInstitution.get(key)!.animals.push(animal)
  }

  // Pošli e-mail každé instituci
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const SITE   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'
  let sent = 0

  for (const { inst, animals } of byInstitution.values()) {
    const rows = animals.map(a => {
      const days = Math.floor((Date.now() - new Date(a.intake_date).getTime()) / (1000 * 60 * 60 * 24))
      return `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #F0E8DC;font-weight:600;color:#2C1810">${a.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F0E8DC;color:#6B3F1F">${new Date(a.intake_date).toLocaleDateString('cs-CZ')}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F0E8DC">
          <span style="background:${days > 180 ? '#E8634A' : '#F0A500'};color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:100px">${days} dní</span>
        </td>
      </tr>`
    }).join('')

    try {
      await resend.emails.send({
        from:    'Zozio <info@zozio.cz>',
        to:      inst.email,
        subject: `⏰ ${animals.length} zvířat v útulku déle než ${thresholdDays} dní`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
            <h2 style="color:#E8634A">⏰ Upomínka dlouhodobého pobytu</h2>
            <p style="color:#2C1810">Dobrý den, <strong>${inst.name}</strong>!</p>
            <p style="color:#2C1810">Tato zvířata jsou u vás déle než ${thresholdDays} dní a stále čekají na adoptivní rodinu:</p>
            <table style="width:100%;border-collapse:collapse;background:#FFF8F3;border-radius:10px;overflow:hidden;margin:16px 0">
              <thead>
                <tr style="background:#E8634A;color:white">
                  <th style="padding:8px 12px;text-align:left;font-size:12px">Zvíře</th>
                  <th style="padding:8px 12px;text-align:left;font-size:12px">Příjem</th>
                  <th style="padding:8px 12px;text-align:left;font-size:12px">Dní v útulku</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="color:#6B3F1F;font-size:13px">Zvažte označení jako <strong>urgentní adopci</strong>, sdílení na sociálních sítích nebo kontakt na media.</p>
            <a href="${SITE}/admin/animals?status=available"
              style="display:inline-block;background:#E8634A;color:white;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:bold;margin-top:8px">
              Přejít do správy zvířat →
            </a>
            <p style="color:#8B7355;font-size:12px;margin-top:24px">
              Tento e-mail dostáváš automaticky každé pondělí. · <a href="${SITE}" style="color:#E8634A">Zozio.cz</a>
            </p>
          </div>
        `,
      })
      sent++
    } catch (err: unknown) {
      console.error(`Email error for ${inst.email}:`, err)
    }
  }

  return NextResponse.json({
    success: true,
    institutions: byInstitution.size,
    animals:      longStayAnimals.length,
    emailsSent:   sent,
  })
}
