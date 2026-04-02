import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import * as React from 'react'
import { InstitutionDigestEmail } from '@/lib/email/templates/InstitutionDigestEmail'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Zozio <info@zozio.cz>'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const body = await request.json()
    const { institution_id, period } = body // period: 'week' | 'month'

    if (!institution_id || !['week', 'month'].includes(period)) {
      return NextResponse.json({ error: 'Chybí parametry' }, { status: 400 })
    }

    const service = createServiceClient()

    // Ověř přístup
    const { data: membership } = await service
      .from('institution_members')
      .select('role')
      .eq('institution_id', institution_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })

    const { data: institution } = await service
      .from('institutions')
      .select('name, type, slug')
      .eq('id', institution_id)
      .single()

    if (!institution) return NextResponse.json({ error: 'Instituce nenalezena' }, { status: 404 })

    const isShelter = institution.type === 'shelter'
    const periodLabel = period === 'week' ? 'tento týden' : 'tento měsíc'
    const since = new Date()
    since.setDate(since.getDate() - (period === 'week' ? 7 : 30))
    const sinceIso = since.toISOString()

    // Načti data za období
    const [animalsRes, statsRes, articlesRes, fundraisersRes, subscribersRes] = await Promise.all([
      // Nová zvířata / případy
      isShelter
        ? service.from('animals')
            .select('name, adoption_status, species:animal_species(icon)')
            .eq('institution_id', institution_id)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(10)
        : service.from('rescue_cases')
            .select('name, case_number, status, species:animal_species(icon)')
            .eq('institution_id', institution_id)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(10),

      // Celkové statistiky (všechna zvířata, ne jen nová)
      isShelter
        ? service.from('animals')
            .select('adoption_status')
            .eq('institution_id', institution_id)
        : service.from('rescue_cases')
            .select('status')
            .eq('institution_id', institution_id),

      // Nové články
      service.from('articles')
        .select('title, perex')
        .eq('institution_id', institution_id)
        .eq('published', true)
        .gte('published_at', sinceIso)
        .order('published_at', { ascending: false })
        .limit(5),

      // Aktivní sbírky
      service.from('fundraisers')
        .select('title, current_amount, goal_amount')
        .eq('institution_id', institution_id)
        .eq('active', true)
        .limit(3),

      // Odběratelé instituce
      service.from('newsletter_subscribers')
        .select('email, name, unsubscribe_token')
        .eq('institution_id', institution_id),
    ])

    const animals = animalsRes.data ?? []
    const allAnimals = statsRes.data ?? []
    const articles = articlesRes.data ?? []
    const fundraisers = fundraisersRes.data ?? []
    const subscribers = subscribersRes.data ?? []

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'Žádní odběratelé' })
    }

    // Statistiky
    const statReceived = animals.length
    const statAdoptedOrReleased = isShelter
      ? allAnimals.filter((a: any) => a.adoption_status === 'adopted').length
      : allAnimals.filter((a: any) => a.status === 'released').length
    const statAvailableOrTreatment = isShelter
      ? allAnimals.filter((a: any) => a.adoption_status === 'available').length
      : allAnimals.filter((a: any) => ['intake', 'treatment', 'rehabilitation'].includes(a.status)).length

    // Formátuj zvířata
    const newAnimals = animals.map((a: any) => ({
      name: a.name ?? a.case_number ?? 'Neznámé',
      emoji: (a.species as any)?.icon ?? (isShelter ? '🐾' : '🦉'),
      status: isShelter
        ? ({ available: 'K adopci', reserved: 'Rezervováno', adopted: 'Adoptováno', foster: 'Pěstounská péče' } as Record<string, string>)[a.adoption_status] ?? a.adoption_status
        : ({ intake: 'Příjem', treatment: 'Léčba', rehabilitation: 'Rehabilitace', released: 'Propuštěno', deceased: 'Uhynulo' } as Record<string, string>)[a.status] ?? a.status,
    }))

    const institutionUrl = `https://zozio.cz/institutions/${institution.slug}`

    // Odešli každému odběrateli
    const emails = await Promise.all(
      subscribers.map(async (sub: any) => {
        const unsubscribeUrl = `https://zozio.cz/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`
        const html = await render(React.createElement(InstitutionDigestEmail, {
          institutionName: institution.name,
          isShelter,
          period,
          periodLabel,
          newAnimals,
          statReceived,
          statAdoptedOrReleased,
          statAvailableOrTreatment,
          newArticles: (articles ?? []).map((a: any) => ({ title: a.title, perex: a.perex })),
          activeFundraisers: (fundraisers ?? []).map((f: any) => ({ title: f.title, current_amount: f.current_amount ?? 0, goal_amount: f.goal_amount ?? 0 })),
          institutionUrl,
          unsubscribeUrl,
        }))
        return {
          from: FROM,
          to: sub.email,
          subject: `📬 Novinky z ${institution.name} za ${periodLabel}`,
          html,
        }
      })
    )

    // Resend batch (max 100 per batch)
    const BATCH = 100
    let sent = 0
    for (let i = 0; i < emails.length; i += BATCH) {
      await resend.batch.send(emails.slice(i, i + BATCH))
      sent += Math.min(BATCH, emails.length - i)
    }

    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('POST /api/newsletter/send-digest error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
