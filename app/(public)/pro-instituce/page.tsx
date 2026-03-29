import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pro útulky a záchranné stanice | Zozio',
  description: 'Spravujte adopce, záchranné případy, sbírky a dobrovolníky na jednom místě. Začněte zdarma.',
}

export default function ProInstitucePage() {
  return (
    <main className="min-h-screen pt-20" style={{ background: '#FFFCF8' }}>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-5 md:px-10"
        style={{ background: 'linear-gradient(135deg, #2C1810 0%, #3D2015 45%, #1C2E28 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '56px 56px', opacity: 0.035 }} />

        <div className="max-w-[1000px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{ background: 'rgba(232,99,74,0.18)', border: '1px solid rgba(232,99,74,0.35)' }}>
            <span className="text-xs font-semibold" style={{ color: '#F5B8A8' }}>Pro útulky a záchranné stanice</span>
          </div>
          <h1 className="font-display font-extrabold text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}>
            Vše pro správu instituce<br />
            <span style={{ color: '#E8634A' }}>na jednom místě</span>
          </h1>
          <p className="text-lg mb-10 max-w-[560px] mx-auto" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
            Adopce, záchranné případy, sbírky, dobrovolníci a komunikace s adoptivními rodinami — vše přehledně v jednom systému.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register?type=shelter">
              <button className="px-8 py-4 rounded-xl font-bold text-base text-white cursor-pointer border-none hover:opacity-90 transition-all"
                style={{ background: '#E8634A', boxShadow: '0 4px 24px rgba(232,99,74,0.40)' }}>
                Registrovat útulek zdarma →
              </button>
            </Link>
            <Link href="/auth/register?type=rescue_station">
              <button className="px-8 py-4 rounded-xl font-bold text-base cursor-pointer border-none hover:opacity-90 transition-all"
                style={{ background: 'rgba(255,255,255,0.10)', color: 'white', border: '1px solid rgba(255,255,255,0.20)' }}>
                Registrovat záchrannou stanici
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features — Útulky */}
      <section className="py-16 md:py-20 px-5 md:px-10 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-2xl">🏠</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8634A' }}>Útulky</p>
              <h2 className="font-display font-extrabold text-[#1A0F0A] text-2xl md:text-3xl">Co dostanete</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '🐾', title: 'Správa zvířat', desc: 'Evidujte všechna zvířata, jejich zdravotní stav, fotky a adopční historii.' },
              { icon: '📋', title: 'Adopční žádosti', desc: 'Přijímejte a spravujte žádosti o adopci. Automatické notifikace e-mailem.' },
              { icon: '💛', title: 'Sbírky', desc: 'Vytvářejte sbírky pro konkrétní zvíře nebo projekt útulku.' },
              { icon: '🙋', title: 'Dobrovolníci', desc: 'Přijímejte přihlášky dobrovolníků a spravujte jejich aktivity.' },
              { icon: '📖', title: 'Příběhy', desc: 'Publikujte příběhy o adoptovaných zvířatech. Budujte komunitu.' },
              { icon: '📊', title: 'Přehledný dashboard', desc: 'Statistiky, trendy a rychlý přístup ke všemu důležitému.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-5 rounded-2xl border border-[#F0EDE8]" style={{ background: '#FAFAF8' }}>
                <div className="text-2xl mb-3">{icon}</div>
                <div className="font-bold text-[#1A0F0A] mb-1">{title}</div>
                <p className="text-sm leading-relaxed" style={{ color: '#8B6550' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — Záchranné stanice */}
      <section className="py-16 md:py-20 px-5 md:px-10" style={{ background: '#F8FDFB' }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-2xl">🚑</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2E9E8F' }}>Záchranné stanice</p>
              <h2 className="font-display font-extrabold text-[#1A0F0A] text-2xl md:text-3xl">Navíc pro vás</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '🦉', title: 'Záchranné případy', desc: 'Evidujte každý případ od příjmu přes léčbu až po propuštění do přírody.' },
              { icon: '📅', title: 'Timeline léčby', desc: 'Přehledná timeline každého záchranného případu viditelná i veřejně.' },
              { icon: '💰', title: 'Sbírky na léčbu', desc: 'Napojte sbírku přímo na záchranný případ. Transparentní pro dárce.' },
              { icon: '🐣', title: 'Rehabilitace', desc: 'Sledujte průběh rehabilitace a dokumentujte pokroky.' },
              { icon: '📸', title: 'Fotogalerie', desc: 'Sdílejte fotky a videa z léčby. Budujte důvěru dárců.' },
              { icon: '🌿', title: 'Propuštění', desc: 'Slavnostně oznamte propuštění. Uzavřete příběh s happy endem.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-5 rounded-2xl border" style={{ background: 'white', borderColor: '#C8EBE3' }}>
                <div className="text-2xl mb-3">{icon}</div>
                <div className="font-bold text-[#1A0F0A] mb-1">{title}</div>
                <p className="text-sm leading-relaxed" style={{ color: '#8B6550' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-5 md:px-10 bg-white">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="font-display font-extrabold text-[#1A0F0A] text-3xl mb-4">Začněte ještě dnes</h2>
          <p className="text-base mb-8" style={{ color: '#8B6550' }}>
            Základní plán je zdarma. Žádná kreditní karta. Nastavení za 5 minut.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register?type=shelter">
              <button className="px-8 py-4 rounded-xl font-bold text-base text-white cursor-pointer border-none hover:opacity-90 transition-all"
                style={{ background: '#E8634A' }}>
                Registrovat útulek →
              </button>
            </Link>
            <Link href="/auth/register?type=rescue_station">
              <button className="px-8 py-4 rounded-xl font-bold text-base cursor-pointer border hover:opacity-80 transition-all"
                style={{ background: 'white', color: '#1A0F0A', borderColor: '#E0DDD8' }}>
                Registrovat záchrannou stanici →
              </button>
            </Link>
          </div>
          <p className="text-sm mt-5" style={{ color: '#8B6550' }}>
            Máte dotaz? Napište nám na{' '}
            <a href="mailto:info@zozio.cz" className="font-bold no-underline hover:opacity-70" style={{ color: '#E8634A' }}>
              info@zozio.cz
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
