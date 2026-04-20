import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ZozLogo } from '@/components/ui/ZozLogo'

export const metadata = { title: 'Čekáme na schválení — Zozio' }

export default async function PendingApprovalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Superadmini rovnou do superadmin sekce
  if (profile?.role === 'superadmin') redirect('/superadmin')

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()

  // Uživatel bez instituce pošli zpět na registraci
  if (!membership) redirect('/auth/register')

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, approval_status, email, city')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/auth/register')

  // Schválená instituce → admin
  if (institution.approval_status === 'approved') redirect('/admin/dashboard')

  const isRejected = institution.approval_status === 'rejected'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-warm">
      <div className="w-full max-w-[560px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">{isRejected ? '⚠️' : '⏳'}</div>
            <h1 className="font-display font-extrabold text-2xl text-text-primary mb-2">
              {isRejected ? 'Registrace vyžaduje doplnění' : 'Čekáme na schválení'}
            </h1>
            <p className="text-sm text-text-muted">
              {isRejected
                ? 'Váš profil nebyl schválen v aktuální podobě. Prosím kontaktujte náš tým.'
                : 'Děkujeme za registraci. Náš tým kontroluje váš profil do 1–2 pracovních dnů.'}
            </p>
          </div>

          <div className="bg-sand rounded-xl p-5 mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              Přehled registrace
            </div>
            <Row label="Instituce" value={institution.name} />
            <Row label="Město" value={institution.city} />
            <Row label="Kontaktní e-mail" value={institution.email ?? user.email ?? '—'} />
            <Row
              label="Stav"
              value={
                <span className={isRejected ? 'text-coral font-bold' : 'text-[#B8860B] font-bold'}>
                  {isRejected ? '❌ Zamítnuto' : '⏳ Čeká na schválení'}
                </span>
              }
            />
          </div>

          {!isRejected && (
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Co se stane dál
              </div>
              <Step num={1} title="Kontrola administrátorem" desc="Ověříme identitu vaší instituce a úplnost údajů." />
              <Step num={2} title="E-mail se schválením" desc="Dostanete potvrzení a plný přístup k admin panelu." />
              <Step num={3} title="Začnete přidávat zvířata" desc="Po aktivaci uvidíte celou platformu a nástroje pro správu." />
            </div>
          )}

          <div className="pt-5 border-t border-border text-center space-y-3">
            <p className="text-sm text-text-muted">
              Máte otázky nebo chcete status urychlit?
            </p>
            <a
              href={`mailto:team@zozio.cz?subject=Registrace — ${encodeURIComponent(institution.name)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white no-underline bg-coral">
              ✉️ Napsat na team@zozio.cz
            </a>
            <div>
              <Link
                href="/auth/logout"
                className="text-xs text-text-muted hover:opacity-70 no-underline">
                Odhlásit se
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-6">
          <Link href="/" className="hover:opacity-70 no-underline text-text-muted">
            ← Zpět na web
          </Link>
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1.5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text-primary text-right">{value}</span>
    </div>
  )
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3 mb-3 last:mb-0">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-coral text-white font-bold text-sm flex items-center justify-center">
        {num}
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm text-text-primary">{title}</div>
        <div className="text-xs text-text-muted mt-0.5">{desc}</div>
      </div>
    </div>
  )
}
