import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { WidgetGenerator } from './WidgetGenerator'

export const metadata = { title: 'Widget — Zozio Admin' }

export default async function WidgetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()

  let institution: { name: string; slug: string; type: string } | null = null
  if (membership?.institution_id) {
    const { data } = await service
      .from('institutions')
      .select('name, slug, type')
      .eq('id', membership.institution_id)
      .single()
    institution = data
  }

  const isShelter = institution?.type === 'shelter'
  const slug = institution?.slug ?? 'vas-utulek'

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Nadpis */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-[#2C1810]">
          🔗 Widget pro váš web
        </h1>
        <p className="text-[#8B6550] mt-1 font-semibold">
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

        {/* 3 kroky */}
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

      {/* Kde ho vložit */}
      <div className="bg-[#FDEAE6] rounded-2xl border border-[#E8634A]/20 p-6 space-y-3">
        <h2 className="font-display font-extrabold text-lg text-[#2C1810]">Kde kód vložit?</h2>
        <div className="space-y-3 text-sm text-[#5C3D2E] leading-relaxed">
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-[#E8634A]/30 flex items-center justify-center text-xs font-bold text-[#E8634A]">W</span>
            <div>
              <strong>WordPress:</strong> Jděte do editoru stránky → přidejte blok „Vlastní HTML" nebo „Custom HTML" → vložte kód.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-[#E8634A]/30 flex items-center justify-center text-xs font-bold text-[#E8634A]">E</span>
            <div>
              <strong>Elementor:</strong> Přetáhněte widget „HTML" na stránku → vložte kód do pole.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-[#E8634A]/30 flex items-center justify-center text-xs font-bold text-[#E8634A]">~</span>
            <div>
              <strong>Jiné systémy:</strong> Hledejte možnost „vložit HTML kód" nebo „embed". Každý web builder tuto funkci má.
            </div>
          </div>
        </div>
      </div>

      {/* Generátor */}
      <div className="bg-white rounded-2xl border border-[#F0EDE8] p-6">
        <h2 className="font-display font-extrabold text-lg text-[#2C1810] mb-5">
          Generátor kódu
        </h2>
        {institution ? (
          <WidgetGenerator slug={slug} isShelter={isShelter} />
        ) : (
          <p className="text-sm text-[#8B6550] font-semibold">
            Generátor je dostupný po propojení s institucí.
          </p>
        )}
      </div>

      {/* Tip */}
      <div className="bg-[#E1F5EE] rounded-2xl border border-[#2E9E8F]/20 p-5">
        <div className="flex gap-3">
          <span className="text-xl">💡</span>
          <div className="text-sm text-[#0F6E56] leading-relaxed">
            <strong>Tip:</strong> Widget se aktualizuje automaticky každou minutu — nemusíte nic dělat,
            jakmile změníte stav zvířete v Zozio adminu, projeví se to na vašem webu samo.
          </div>
        </div>
      </div>
    </div>
  )
}
