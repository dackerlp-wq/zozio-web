import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SupportTicketForm } from '@/components/admin/SupportTicketForm'
import { effectivePlan, PLAN_NAMES } from '@/lib/plans'
import type { SubscriptionPlan } from '@/types/database'

export const metadata = { title: 'Podpora — Zozio Admin' }

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

  const plan = effectivePlan(
    (institution as any).plan as SubscriptionPlan ?? 'free',
    (institution as any).plan_expires_at ?? null,
  )

  const isFree     = plan === 'free'
  const isStandard = plan === 'standard'
  const isPro      = plan === 'pro'

  return (
    <div className="max-w-[720px] space-y-8">

      {/* Hlavička */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso">🎧 Podpora</h1>
        <p className="text-sm text-[#8B6550] font-semibold mt-1">{institution.name}</p>
      </div>

      {/* Aktuální úroveň podpory */}
      <div
        className="rounded-2xl p-5 border-2 flex items-center gap-4"
        style={{ borderColor: isPro ? '#F0A500' : isStandard ? '#E8634A' : '#F0EDE8', background: '#FFFCF8' }}
      >
        <div className="text-3xl flex-shrink-0">
          {isPro ? '🚀' : isStandard ? '⭐' : '🐾'}
        </div>
        <div>
          <div className="text-xs font-bold text-[#8B6550] uppercase tracking-wider mb-0.5">Váš plán podpory</div>
          <div className="font-display font-extrabold text-lg text-espresso">{PLAN_NAMES[plan]}</div>
          <div className="text-xs text-[#8B6550] mt-0.5">
            {isPro      && 'Prioritní fronta · SLA 4h · Telefon'}
            {isStandard && 'Formulář na platformě · Odpověď do 24h'}
            {isFree     && 'E-mailová podpora · Odpověď do 48h'}
          </div>
        </div>
        {isFree && (
          <Link href="/admin/billing"
            className="ml-auto inline-flex items-center px-4 py-2 rounded-full text-xs font-bold no-underline flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: '#E8634A', color: '#fff' }}>
            Upgradovat
          </Link>
        )}
      </div>

      {/* ── FREE: jen e-mail ── */}
      {isFree && (
        <section className="space-y-4">
          <h2 className="font-display font-extrabold text-lg text-espresso">Kontaktovat podporu</h2>
          <div className="bg-white rounded-2xl border border-[#F0EDE8] shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#FAECE7' }}>📧</div>
              <div className="flex-1">
                <div className="font-bold text-sm text-espresso mb-1">E-mail podpora</div>
                <p className="text-xs text-[#8B6550] mb-3">
                  Napište nám na <strong>team@zozio.cz</strong>. Odpovídáme do 48 pracovních hodin.
                </p>
                <a
                  href={`mailto:team@zozio.cz?subject=Dotaz — ${institution.name}`}
                  className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold no-underline transition-opacity hover:opacity-90"
                  style={{ background: '#E8634A', color: '#fff' }}
                >
                  Napsat e-mail
                </a>
              </div>
            </div>
          </div>

          {/* Teaser Standard */}
          <div className="rounded-2xl border-2 border-dashed p-5 flex items-center gap-4"
            style={{ borderColor: '#F0EDE8' }}>
            <div className="text-2xl flex-shrink-0">⭐</div>
            <div className="flex-1">
              <div className="font-bold text-sm text-espresso mb-0.5">Standard — formulář přímo na platformě</div>
              <p className="text-xs text-[#A09890]">Odesílejte zprávy přímo z adminu bez otevírání e-mailu. Odpověď do 24h.</p>
            </div>
            <Link href="/admin/billing"
              className="text-xs font-bold no-underline flex-shrink-0"
              style={{ color: '#E8634A' }}>
              Upgradovat →
            </Link>
          </div>
        </section>
      )}

      {/* ── STANDARD: formulář ── */}
      {isStandard && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-lg text-espresso">Napsat zprávu</h2>
            <span className="text-xs text-[#8B6550] font-semibold">Odpovíme do 24 hodin</span>
          </div>
          <div className="bg-white rounded-2xl border border-[#F0EDE8] shadow-sm p-5 md:p-6">
            <SupportTicketForm />
          </div>

          {/* E-mail záloha */}
          <p className="text-xs text-[#A09890] font-semibold">
            Nebo napište přímo na{' '}
            <a href="mailto:team@zozio.cz" className="text-[#E8634A] no-underline hover:underline">
              team@zozio.cz
            </a>
          </p>

          {/* Teaser Pro */}
          <div className="rounded-2xl border-2 border-dashed p-5 flex items-center gap-4"
            style={{ borderColor: '#F5D8A0' }}>
            <div className="text-2xl flex-shrink-0">🚀</div>
            <div className="flex-1">
              <div className="font-bold text-sm text-espresso mb-0.5">Pro — prioritní fronta a SLA 4h</div>
              <p className="text-xs text-[#A09890]">Garantovaná odpověď do 4 hodin, přímý telefon, urgentní linka.</p>
            </div>
            <Link href="/admin/billing"
              className="text-xs font-bold no-underline flex-shrink-0"
              style={{ color: '#E8634A' }}>
              Upgradovat →
            </Link>
          </div>
        </section>
      )}

      {/* ── PRO: vše ── */}
      {isPro && (
        <section className="space-y-6">
          {/* SLA karta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '⚡', title: '4 hodiny', sub: 'Odpověď na formulář', note: 'Prac. dny 8:00–18:00' },
              { icon: '🔧', title: '1 hodina', sub: 'Urgentní technický problém', note: 'Přes telefon nebo e-mail' },
              { icon: '🗓️', title: '48 hodin', sub: 'Onboarding konzultace', note: 'Na vyžádání' },
            ].map(({ icon, title, sub, note }) => (
              <div key={title} className="bg-white rounded-xl border border-[#F0EDE8] shadow-sm p-4 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="font-display font-extrabold text-xl text-espresso">{title}</div>
                <div className="text-xs font-bold text-[#8B6550] mt-0.5">{sub}</div>
                <div className="text-[10px] text-[#A09890] mt-0.5">{note}</div>
              </div>
            ))}
          </div>

          {/* Formulář */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-extrabold text-lg text-espresso">Napsat zprávu</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-pill"
                style={{ background: '#FFF3D6', color: '#A05000' }}>
                🚀 Prioritní fronta
              </span>
            </div>
            <div className="bg-white rounded-2xl border-2 shadow-sm p-5 md:p-6"
              style={{ borderColor: '#F0A500' }}>
              <SupportTicketForm />
            </div>
          </div>

          {/* Přímý kontakt */}
          <div className="bg-white rounded-2xl border border-[#F0EDE8] shadow-sm p-5">
            <h3 className="font-display font-extrabold text-base text-espresso mb-4">Přímý kontakt</h3>
            <div className="space-y-3">
              <a href="mailto:team@zozio.cz"
                className="flex items-center gap-3 no-underline group">
                <span className="text-xl">📧</span>
                <div>
                  <div className="font-bold text-sm text-espresso group-hover:text-coral transition-colors">team@zozio.cz</div>
                  <div className="text-xs text-[#A09890]">SLA odpověď do 4 hod</div>
                </div>
              </a>
              <div className="h-px bg-[#F0EDE8]" />
              <div className="flex items-center gap-3">
                <span className="text-xl">🔴</span>
                <div>
                  <div className="font-bold text-sm text-espresso">Urgentní linka</div>
                  <div className="text-xs text-[#A09890]">Kontakt po odeslání ticketu s kategorií „Technický problém"</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dokumentace — pro všechny */}
      <section>
        <h2 className="font-display font-extrabold text-lg text-espresso mb-4">Rychlá pomoc</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '🐾', title: 'Přidat zvíře',       href: '/admin/animals/new',        desc: 'Průvodce přidáním nového zvířete' },
            { icon: '💛', title: 'Vytvořit sbírku',    href: '/admin/fundraisers/new',    desc: 'Jak spustit fundraisingovou kampaň' },
            { icon: '⚙️', title: 'Nastavení profilu',  href: '/admin/settings/info',      desc: 'Základní informace o instituci' },
            { icon: '🚀', title: 'Onboarding průvodce',href: '/admin/onboarding',         desc: 'Kontrolní seznam pro nové instituce' },
          ].map(({ icon, title, href, desc }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#F0EDE8] shadow-sm no-underline hover:border-[#E8634A]/40 transition-all group">
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div>
                <div className="font-bold text-sm text-espresso group-hover:text-coral transition-colors">{title}</div>
                <div className="text-xs text-[#A09890]">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
