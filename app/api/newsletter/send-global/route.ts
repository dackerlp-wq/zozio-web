import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import * as React from 'react'
import { NewsletterEmail } from '@/lib/email/templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Zozio <info@zozio.cz>'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

    const service = createServiceClient()

    // Ověř superadmin
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Nemáš přístup' }, { status: 403 })
    }

    // Načti stats a odběratele paralelně
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthName = now.toLocaleString('cs-CZ', { month: 'long', year: 'numeric' })

    const [adoptedRes, newInstRes, animalsRes, articlesRes, subscribersRes] = await Promise.all([
      service.from('adoption_applications').select('id', { count: 'exact', head: true }).eq('status', 'adopted').gte('updated_at', monthStart),
      service.from('institutions').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved').gte('created_at', monthStart),
      service.from('animals').select('id', { count: 'exact', head: true }).eq('adoption_status', 'available').eq('published', true),
      service.from('articles').select('title, category, published_at').eq('published', true).order('published_at', { ascending: false }).limit(4),
      service.from('newsletter_subscribers').select('email, unsubscribe_token').is('institution_id', null),
    ])

    const subscribers = subscribersRes.data ?? []
    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'Žádní odběratelé' })
    }

    const articles = (articlesRes.data ?? []).map((a: any) => ({
      emoji: '🐾',
      label: 'Příběh adopce',
      labelColor: '#E8634A',
      title: a.title,
    }))

    const emails = await Promise.all(
      subscribers.map(async (sub: any) => {
        const html = await render(React.createElement(NewsletterEmail, {
          month: monthName,
          adoptionCount: adoptedRes.count ?? 0,
          releasedCount: 0,
          newInstitutionsCount: newInstRes.count ?? 0,
          animalsCount: animalsRes.count ?? 0,
          articles,
          browseUrl: 'https://zozio.cz/adopt',
        }))
        return {
          from: FROM,
          to: sub.email,
          subject: `🐾 Zozio Novinky — ${monthName}`,
          html,
        }
      })
    )

    const BATCH = 100
    let sent = 0
    for (let i = 0; i < emails.length; i += BATCH) {
      await resend.batch.send(emails.slice(i, i + BATCH))
      sent += Math.min(BATCH, emails.length - i)
    }

    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('POST /api/newsletter/send-global error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
