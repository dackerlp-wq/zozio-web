import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { UpgradePrompt } from '@/components/admin/UpgradePrompt'
import { hasFeature, PLAN_NAMES } from '@/lib/plans'
import type { SubscriptionPlan } from '@/types/database'

export const metadata = { title: 'Prioritní podpora — Zozio Admin' }

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Jak rychle odpovídáte na dotazy?',
    a: 'Na e-maily od Pro zákazníků odpovídáme do 4 pracovních hodin v pracovní dny (Po–Pá, 8:00–18:00). Urgentní technické problémy řešíme do 1 hodiny.',
  },
  {
    q: 'Co je zahrnuto v prioritní podpoře?',
    a: 'Garantovaná SLA 4h, dedikovaný kontakt na tým Zozio, pomoc s nastavením integrace Darujme.cz, konzultace ke správě profilu a adopčnímu procesu, a pomoc s migrací dat.',
  },
  {
    q: 'Jak nahlásím technický problém?',
    a: 'Pošlete e-mail na team@zozio.cz s předmětem začínajícím [PRO]. Pro urgentní problémy použijte telefon uvedený níže.',
  },
  {
    q: 'Pomáháte i s exportem dat?',
    a: 'Ano, na vyžádání připravíme export vašich dat v libovolném formátu. Kontaktujte nás e-mailem.',
  },
  {
    q: 'Mohu požádat o novou funkci?',
    a: 'Samozřejmě — Pro zákazníci mají prioritu ve feature requestech. Napište nám co potřebujete a my to zařadíme do roadmapy.',
  },
]

export default async function SupportPage() {
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
    .select('id, name, plan, plan_expires_at')
    .eq('id', membership.institution_id)
    .single()
  if (!institution) redirect('/admin/dashboard')

  const plan = (institution as any).plan as SubscriptionPlan ?? 'free'
  const expiresAt = (institution as any).plan_expires_at ?? null

  if (!hasFeature(plan, expiresAt, 'priority_support')) {
    return <UpgradePrompt feature="priority_support" />
  }

  const { data: profile } = await service
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const userName  = (profile as any)?.full_name ?? ''
  const userEmail = user.email ?? ''
  const instName  = institution.name

  const mailtoBody = encodeURIComponent(
    `Instituce: ${instName}\nKontakt: ${userName} <${userEmail}>\nPlán: ${PLAN_NAMES[plan]}\n\n---\n\nPopis problému / dotaz:\n\n`
  )
  const mailtoUrgent = `mailto:team@zozio.cz?subject=[PRO] Urgentní — ${instName}&body=${mailtoBody}`
  const mailtoNormal = `mailto:team@zozio.cz?subject=[PRO] Dotaz — ${instName}&body=${mailtoBody}`

  return (
    <div className="max-w-[720px] space-y-8">

      {/* Hlavička */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: '#FAECE7' }}>
          🚀
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso leading-tight">
            Prioritní podpora
          </h1>
          <p className="text-sm text-[#8B6550] font-semibold mt-1">
            Plán {PLAN_NAMES[plan]} · {institution.name}
          </p>
        </div>
      </div>

      {/* SLA karta */}
      <div
        className="rounded-2xl p-5 md:p-6 border-2"
        style={{ borderColor: '#E8634A', background: '#FFFCF8' }}
      >
        <div className="text-xs font-bold text-[#E8634A] uppercase tracking-widest mb-3">Vaše SLA garance</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '⚡', title: '4 hodiny', sub: 'Doba odpovědi na e-mail', note: 'Pracovní dny 8:00–18:00' },
            { icon: '🔧', title: '1 hodina', sub: 'Urgentní technický problém', note: 'Přes telefon nebo e-mail' },
            { icon: '🗓️', title: '48 hodin', sub: 'Onboarding konzultace', note: 'Na vyžádání' },
          ].map(({ icon, title, sub, note }) => (
            <div key={title} className="text-center">
              <div className="text-3xl mb-1">{icon}</div>
              <div className="font-display font-extrabold text-xl text-espresso">{title}</div>
              <div className="text-xs font-bold text-[#8B6550] mt-0.5">{sub}</div>
              <div className="text-[10px] text-[#A09890] mt-0.5">{note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kontaktní možnosti */}
      <section>
        <h2 className="font-display font-extrabold text-lg text-espresso mb-4">Kontaktovat podporu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <a href={mailtoNormal}
            className="flex items-start gap-4 p-5 bg-white rounded-xl border border-[#F0EDE8] shadow-sm no-underline hover:border-[#E8634A]/40 transition-all group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: '#FAECE7' }}>
              📧
            </div>
            <div>
              <div className="font-bold text-espresso text-sm group-hover:text-coral transition-colors">E-mail — standardní dotaz</div>
              <div className="text-xs text-[#8B6550] mt-0.5">team@zozio.cz</div>
              <div className="text-[10px] text-[#A09890] mt-1">Odpověď do 4 hod (prac. dny)</div>
            </div>
          </a>

          <a href={mailtoUrgent}
            className="flex items-start gap-4 p-5 bg-white rounded-xl border border-[#F0EDE8] shadow-sm no-underline hover:border-[#DC2626]/40 transition-all group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: '#FEF2F2' }}>
              🚨
            </div>
            <div>
              <div className="font-bold text-espresso text-sm group-hover:text-[#DC2626] transition-colors">Urgentní technický problém</div>
              <div className="text-xs text-[#8B6550] mt-0.5">team@zozio.cz · předmět [PRO]</div>
              <div className="text-[10px] text-[#A09890] mt-1">Odpověď do 1 hodiny</div>
            </div>
          </a>

        </div>

        <div className="mt-4 p-4 rounded-xl bg-[#F5F0EC]">
          <p className="text-xs text-[#8B6550] font-semibold">
            💡 <strong className="text-espresso">Tip:</strong> Pro rychlejší vyřízení uveďte v e-mailu název instituce
            a popis problému s co nejvíce detaily (co se stalo, co jste dělali, kdy to nastalo).
            E-maily od Pro zákazníků jsou automaticky označeny jako prioritní.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="font-display font-extrabold text-lg text-espresso mb-4">Časté otázky</h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="bg-white rounded-xl border border-[#F0EDE8] shadow-sm p-5">
              <div className="font-bold text-sm text-espresso mb-2">{q}</div>
              <p className="text-sm text-[#8B6550] leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature request */}
      <div className="rounded-2xl p-5 md:p-6"
        style={{ background: 'linear-gradient(135deg, #2C1810 0%, #4A2E20 100%)' }}>
        <div className="text-3xl mb-2">💡</div>
        <h3 className="font-display font-extrabold text-lg text-white mb-1">Chybí vám funkce?</h3>
        <p className="text-sm text-[#C9B8AD] mb-4">
          Pro zákazníci mají přímý vliv na roadmapu. Napište nám co by vám ušetřilo čas.
        </p>
        <a
          href={`mailto:team@zozio.cz?subject=[PRO] Feature request — ${instName}&body=${encodeURIComponent(`Instituce: ${instName}\n\nNávrh funkce:\n\n`)}`}
          className="inline-flex items-center px-5 py-2.5 rounded-full font-bold text-sm no-underline transition-opacity hover:opacity-90"
          style={{ background: '#E8634A', color: '#fff' }}
        >
          Navrhnout funkci
        </a>
      </div>

    </div>
  )
}
