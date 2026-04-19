import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UpgradePrompt } from '@/components/admin/UpgradePrompt'
import { hasFeature } from '@/lib/plans'
import type { SubscriptionPlan } from '@/types/database'

export const metadata = { title: 'Onboarding — Zozio Admin' }

interface Step {
  id: string
  icon: string
  title: string
  description: string
  done: boolean
  href: string
  hrefLabel: string
  priority: 'critical' | 'important' | 'optional'
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('role, institution_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) redirect('/auth/register')

  const { data: institution } = await service
    .from('institutions')
    .select('*')
    .eq('id', membership.institution_id)
    .single()
  if (!institution) redirect('/admin/dashboard')

  if (!hasFeature(
    (institution as any).plan as SubscriptionPlan ?? 'free',
    (institution as any).plan_expires_at ?? null,
    'onboarding'
  )) {
    return <UpgradePrompt feature="onboarding" />
  }

  const iid = membership.institution_id

  // Kontrolní data
  const [
    { count: animalCount },
    { count: appCount },
    { count: subscriberCount },
    { count: volunteerCount },
    { count: fundraiserCount },
  ] = await Promise.all([
    service.from('animals').select('id', { count: 'exact', head: true }).eq('institution_id', iid),
    service.from('adoption_applications').select('id', { count: 'exact', head: true }).eq('institution_id', iid),
    service.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('institution_id', iid),
    service.from('volunteers').select('id', { count: 'exact', head: true }).eq('institution_id', iid),
    service.from('fundraisers').select('id', { count: 'exact', head: true }).eq('institution_id', iid),
  ])

  const inst = institution as any

  const steps: Step[] = [
    // Kritické
    {
      id: 'approved',
      icon: '✅',
      title: 'Schválení profilu',
      description: 'Váš profil byl zkontrolován a schválen týmem Zozio.',
      done: inst.approval_status === 'approved',
      href: '/admin/settings/info',
      hrefLabel: 'Zkontrolovat nastavení',
      priority: 'critical',
    },
    {
      id: 'logo',
      icon: '🖼️',
      title: 'Nahrát logo instituce',
      description: 'Logo se zobrazuje ve výsledcích vyhledávání a na profilu útulku.',
      done: !!inst.logo_url,
      href: '/admin/settings/info',
      hrefLabel: 'Nahrát logo',
      priority: 'critical',
    },
    {
      id: 'description',
      icon: '📝',
      title: 'Vyplnit popis instituce',
      description: 'Podrobný popis pomáhá návštěvníkům pochopit vaši misi a způsob práce.',
      done: !!(inst.description && inst.description.length > 50),
      href: '/admin/settings/info',
      hrefLabel: 'Upravit popis',
      priority: 'critical',
    },
    {
      id: 'contact',
      icon: '📞',
      title: 'Doplnit kontaktní údaje',
      description: 'E-mail a telefon jsou povinné pro komunikaci se zájemci o adopci.',
      done: !!(inst.email && inst.phone),
      href: '/admin/settings/info',
      hrefLabel: 'Doplnit kontakt',
      priority: 'critical',
    },
    {
      id: 'location',
      icon: '📍',
      title: 'Nastavit polohu na mapě',
      description: 'GPS souřadnice zajistí zobrazení na veřejné mapě útulků.',
      done: !!(inst.lat && inst.lng),
      href: '/admin/settings/info',
      hrefLabel: 'Nastavit polohu',
      priority: 'critical',
    },
    // Důležité
    {
      id: 'first_animal',
      icon: '🐾',
      title: 'Přidat první zvíře',
      description: `Aktuálně máte ${animalCount ?? 0} zvířat v databázi.`,
      done: (animalCount ?? 0) > 0,
      href: '/admin/animals/new',
      hrefLabel: 'Přidat zvíře',
      priority: 'important',
    },
    {
      id: 'cover',
      icon: '🌅',
      title: 'Nahrát titulní fotografii',
      description: 'Hlavní fotografie instituce — zobrazuje se v horní části profilu.',
      done: !!inst.cover_url,
      href: '/admin/settings/info',
      hrefLabel: 'Nahrát fotografii',
      priority: 'important',
    },
    {
      id: 'hours',
      icon: '🕐',
      title: 'Nastavit provozní dobu',
      description: 'Návštěvníci uvidí kdy mohou přijít osobně.',
      done: !!(inst.opening_hours && inst.opening_hours.length > 5),
      href: '/admin/settings/hours',
      hrefLabel: 'Nastavit hodiny',
      priority: 'important',
    },
    {
      id: 'first_app',
      icon: '📋',
      title: 'První žádost o adopci',
      description: `Přijato celkem ${appCount ?? 0} žádostí. Začne přicházet jakmile zveřejníte zvířata.`,
      done: (appCount ?? 0) > 0,
      href: '/admin/applications',
      hrefLabel: 'Zobrazit žádosti',
      priority: 'important',
    },
    // Volitelné
    {
      id: 'darujme',
      icon: '💛',
      title: 'Propojit Darujme.cz',
      description: 'Aktivujte sbírky propojením s vaším účtem na Darujme.cz.',
      done: !!(inst.darujme_api_id && inst.darujme_api_secret),
      href: '/admin/settings/integrations',
      hrefLabel: 'Propojit',
      priority: 'optional',
    },
    {
      id: 'fundraiser',
      icon: '🎯',
      title: 'Vytvořit první sbírku',
      description: `Celkem ${fundraiserCount ?? 0} sbírek. Sbírky pomáhají financovat péči o zvířata.`,
      done: (fundraiserCount ?? 0) > 0,
      href: '/admin/fundraisers/new',
      hrefLabel: 'Vytvořit sbírku',
      priority: 'optional',
    },
    {
      id: 'volunteer',
      icon: '🙋',
      title: 'První dobrovolník',
      description: `Celkem ${volunteerCount ?? 0} dobrovolníků. Přihlásí se sami přes váš veřejný profil.`,
      done: (volunteerCount ?? 0) > 0,
      href: '/admin/volunteers',
      hrefLabel: 'Správa dobrovolníků',
      priority: 'optional',
    },
    {
      id: 'newsletter',
      icon: '📬',
      title: 'Získat prvního odběratele newsletteru',
      description: `Celkem ${subscriberCount ?? 0} odběratelů. Sdílejte odkaz na profil — formulář je přímo tam.`,
      done: (subscriberCount ?? 0) > 0,
      href: '/admin/newsletter',
      hrefLabel: 'Otevřít newsletter',
      priority: 'optional',
    },
    {
      id: 'website',
      icon: '🌐',
      title: 'Doplnit odkaz na web instituce',
      description: 'Pokud máte vlastní web, zobrazí se na profilu jako externí odkaz.',
      done: !!inst.website,
      href: '/admin/settings/info',
      hrefLabel: 'Doplnit web',
      priority: 'optional',
    },
    {
      id: 'social',
      icon: '📱',
      title: 'Propojit sociální sítě',
      description: 'Facebook a Instagram se zobrazují na veřejném profilu.',
      done: !!(inst.facebook_url || inst.instagram_url),
      href: '/admin/settings/info',
      hrefLabel: 'Doplnit sítě',
      priority: 'optional',
    },
  ]

  const done  = steps.filter(s => s.done).length
  const total = steps.length
  const pct   = Math.round((done / total) * 100)

  const critical  = steps.filter(s => s.priority === 'critical')
  const important = steps.filter(s => s.priority === 'important')
  const optional  = steps.filter(s => s.priority === 'optional')

  const criticalDone = critical.filter(s => s.done).length

  return (
    <div className="max-w-[720px] space-y-8">

      {/* Hlavička */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-1">🚀 Onboarding</h1>
        <p className="text-sm text-[#8B6550] font-semibold">{institution.name} — průvodce nastavením</p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-[#F0EDE8] shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-extrabold text-lg text-espresso">{done} / {total} kroků dokončeno</span>
          <span className="font-display font-extrabold text-2xl" style={{ color: pct === 100 ? '#16A34A' : '#E8634A' }}>{pct} %</span>
        </div>
        <div className="h-3 bg-[#F5F0EC] rounded-pill overflow-hidden">
          <div
            className="h-full rounded-pill transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#16A34A' : 'linear-gradient(90deg, #E8634A, #F0A500)',
            }}
          />
        </div>
        {pct === 100 && (
          <p className="text-sm font-bold text-[#16A34A] mt-3">🎉 Gratulujeme! Profil je kompletně nastaven.</p>
        )}
        {criticalDone < critical.length && (
          <p className="text-xs text-[#DC2626] mt-3 font-semibold">
            ⚠️ Zbývají {critical.length - criticalDone} kritické kroky — bez nich se instituce nezobrazí správně.
          </p>
        )}
      </div>

      {/* Skupiny kroků */}
      {[
        { label: '🔴 Kritické', steps: critical, color: '#DC2626', bg: '#FEF2F2' },
        { label: '🟡 Důležité', steps: important, color: '#D97706', bg: '#FFFBEB' },
        { label: '🟢 Volitelné', steps: optional, color: '#16A34A', bg: '#F0FDF4' },
      ].map(({ label, steps: group, color, bg }) => (
        <section key={label}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display font-extrabold text-base text-espresso">{label}</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-pill"
              style={{ background: bg, color }}>
              {group.filter(s => s.done).length}/{group.length}
            </span>
          </div>
          <div className="space-y-2">
            {group.map(step => (
              <div key={step.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  step.done
                    ? 'bg-[#F9F8F6] border-[#F0EDE8] opacity-70'
                    : 'bg-white border-[#F0EDE8] shadow-sm hover:border-[#E8634A]/30'
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
                  step.done ? 'bg-[#F0FDF4]' : 'bg-[#FAECE7]'
                }`}>
                  {step.done ? '✓' : step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm ${step.done ? 'text-[#8B6550] line-through' : 'text-espresso'}`}>
                      {step.title}
                    </span>
                    {step.done && <span className="text-[10px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-pill">Hotovo</span>}
                  </div>
                  <p className="text-xs text-[#8B6550] mt-0.5 leading-relaxed">{step.description}</p>
                </div>
                {!step.done && (
                  <Link href={step.href}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold no-underline flex-shrink-0 transition-colors hover:opacity-90"
                    style={{ background: '#E8634A', color: '#fff' }}>
                    {step.hrefLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Kontakt na Zozio tým */}
      <div className="rounded-2xl p-5 md:p-6 text-center" style={{ background: '#F5F0EC' }}>
        <div className="text-3xl mb-2">💌</div>
        <h3 className="font-display font-extrabold text-base text-espresso mb-1">Potřebujete pomoc s nastavením?</h3>
        <p className="text-sm text-[#8B6550] mb-4">Náš tým vám pomůže nastavit profil tak, aby přilákal co nejvíce zájemců.</p>
        <a href="mailto:team@zozio.cz?subject=Onboarding pomoc — Pro plán"
          className="inline-flex items-center px-5 py-2.5 rounded-full font-bold text-sm text-white no-underline transition-opacity hover:opacity-90"
          style={{ background: '#E8634A' }}>
          Napsat týmu Zozio
        </a>
      </div>

    </div>
  )
}
