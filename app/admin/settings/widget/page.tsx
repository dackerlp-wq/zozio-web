import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { WidgetGenerator } from '@/app/admin/widget/WidgetGenerator'

export const metadata = { title: 'Widget — Nastavení — Zozio Admin' }

export default async function SettingsWidgetPage() {
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
    .select('id, name, type, slug')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  const isShelter = institution.type === 'shelter'
  const slug = institution.slug ?? 'vas-utulek'

  return (
    <div className="space-y-8 max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-[#A09890] font-semibold">
        <span>Nastavení</span>
        <span>·</span>
        <span className="text-[#2C1810]">Widget</span>
      </nav>

      <div>
        <h1 className="font-display font-extrabold text-2xl text-[#2C1810]">
          🔗 Widget pro váš web
        </h1>
        <p className="text-[#8B6550] mt-1 font-semibold text-sm">
          Zobrazte vaše zvířata přímo na svém webu — bez programování.
        </p>
      </div>

      {/* Co je widget */}
      <div className="bg-white rounded-2xl border border-[#F0EDE8] p-6 space-y-4">
        <h2 className="font-display font-extrabold text-lg text-[#2C1810]">Co je widget?</h2>
        <p className="text-sm text-[#5C3D2E] leading-relaxed">
          Widget je malý kousek kódu, který vložíte na svůj web (WordPress, Wix, Squarespace…)
          a automaticky se tam zobrazí vaše aktuální zvířata z Zozia. Nemusíte nic ručně aktualizovat —
          jakmile přidáte nebo adoptujete zvíře v adminu, widget se sám aktualizuje.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          {[
            { step: '1', icon: '📋', title: 'Vygenerujte kód', desc: 'Vyberte nastavení níže a zkopírujte kód.' },
            { step: '2', icon: '🌐', title: 'Vložte na web', desc: 'Vložte kód do HTML editoru na vašem webu.' },
            { step: '3', icon: '✨', title: 'Hotovo!', desc: 'Widget se automaticky zobrazí a aktualizuje.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-[#FFFCF8] rounded-xl p-4 border border-[#F0EDE8]">
              <div className="w-7 h-7 rounded-full bg-[#E8634A] text-white text-xs font-extrabold flex items-center justify-center mb-2">
                {step}
              </div>
              <div className="text-lg mb-1">{icon}</div>
              <div className="font-bold text-sm text-[#2C1810]">{title}</div>
              <div className="text-xs text-[#8B6550] mt-0.5 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Generátor */}
      <div className="bg-white rounded-2xl border border-[#F0EDE8] p-6">
        <h2 className="font-display font-extrabold text-lg text-[#2C1810] mb-5">
          Generátor kódu
        </h2>
        <WidgetGenerator slug={slug} isShelter={isShelter} />
      </div>
    </div>
  )
}
