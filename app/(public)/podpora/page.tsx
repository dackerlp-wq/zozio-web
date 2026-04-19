import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Podpora | Zozio',
  description: 'Potřebuješ pomoc? Najdi odpovědi na časté otázky nebo nás kontaktuj přímo.',
}

const FAQ_ADOPTERS = [
  {
    q: 'Jak podat žádost o adopci?',
    a: 'Na profilu zvířete klikni na tlačítko „Chci adoptovat" a vyplň krátký formulář. Útulek dostane tvou žádost a ozve se ti.',
  },
  {
    q: 'Jak dlouho trvá vyřízení adopce?',
    a: 'Záleží na konkrétním útulku. Většina útulků reaguje do 2–5 pracovních dnů. Průběh adopce pak závisí na jejich interních postupech.',
  },
  {
    q: 'Mohu sledovat více zvířat najednou?',
    a: 'Ano. Zvířata přidáváš do oblíbených srdíčkem na jejich profilu. Najdeš je pak v sekci Oblíbená ve svém profilu.',
  },
  {
    q: 'Co když útulek nereaguje?',
    a: 'Zkus ho kontaktovat přímo přes kontaktní údaje na jejich profilu. Pokud je situace dlouhodobá, dej nám vědět přes formulář níže.',
  },
  {
    q: 'Je Zozio zdarma pro adoptéry?',
    a: 'Ano. Pro lidi hledající zvíře je Zozio zcela zdarma bez jakýchkoliv poplatků.',
  },
]

const FAQ_INSTITUTIONS = [
  {
    q: 'Jak zaregistrovat útulek nebo záchrannou stanici?',
    a: 'Klikni na „Pro instituce" v hlavním menu a zvol registraci. Po ověření e-mailu si nastavíš profil instituce.',
  },
  {
    q: 'Kolik zvířat mohu přidat v bezplatném plánu?',
    a: 'Bezplatný plán umožňuje přidat až 20 zvířat nebo záchranných případů. Pro neomezený počet přejdi na plán Standard nebo Pro.',
  },
  {
    q: 'Jak fungují adopční žádosti?',
    a: 'Dostanete e-mail s notifikací a zároveň žádost vidíte v administraci pod konkrétním zvířetem. Žádost můžete přijmout nebo zamítnout přímo z adminu.',
  },
  {
    q: 'Jsou neziskové organizace zvýhodněny?',
    a: 'Ano. Registrované neziskové organizace a spolky dostanou 30% slevu na placené plány. Kontaktujte nás přes formulář níže.',
  },
  {
    q: 'Jak exportovat data o zvířatech?',
    a: 'Export do CSV je dostupný ve Standard a Pro plánu. Najdeš ho v Administraci → Nastavení → Export dat.',
  },
  {
    q: 'Mohu mít více správců pro jeden útulek?',
    a: 'Více správců plánujeme do konce roku. Zatím pracuje s účtem vždy jedna osoba. Sledujte novinky.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-[#F0EDE8] rounded-lg bg-white overflow-hidden">
      <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none font-bold text-sm text-[#1A0F0A] hover:bg-[#FFFCF8] transition-colors">
        {q}
        <span className="shrink-0 text-[#E8634A] text-lg transition-transform duration-200 group-open:rotate-45">+</span>
      </summary>
      <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: '#8B6550' }}>{a}</p>
    </details>
  )
}

export default function PodporaPage() {
  return (
    <main className="min-h-screen pt-20" style={{ background: '#FFFCF8' }}>

      {/* Hero */}
      <section className="py-16 md:py-20 px-5 md:px-10 text-center">
        <div className="max-w-[640px] mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E8634A' }}>Podpora</p>
          <h1
            className="font-display font-extrabold text-[#1A0F0A] mb-4"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
          >
            Jsme tu pro tebe
          </h1>
          <p className="text-lg" style={{ color: '#8B6550' }}>
            Najdi odpovědi na časté otázky nebo nám napiš — odpovíme do 1–2 pracovních dnů.
          </p>
        </div>
      </section>

      {/* Quick contact cards */}
      <section className="pb-12 px-5 md:px-10">
        <div className="max-w-[900px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '✉️',
              title: 'E-mail',
              desc: 'info@zozio.cz',
              sub: 'Odpovídáme do 2 prac. dnů',
              href: 'mailto:info@zozio.cz',
            },
            {
              icon: '📖',
              title: 'Dokumentace',
              desc: 'Průvodce a návody',
              sub: 'Článková nápověda',
              href: '/articles',
            },
            {
              icon: '💬',
              title: 'Kontaktní formulář',
              desc: 'Napiš nám přímo',
              sub: 'Níže na této stránce',
              href: '#kontakt',
            },
          ].map(card => (
            <a
              key={card.title}
              href={card.href}
              className="flex flex-col items-center gap-2 p-6 bg-white rounded-xl border border-[#F0EDE8] text-center hover:border-[#E8634A] hover:-translate-y-0.5 transition-all"
            >
              <span className="text-3xl">{card.icon}</span>
              <span className="font-display font-extrabold text-[#1A0F0A]">{card.title}</span>
              <span className="text-sm font-medium" style={{ color: '#E8634A' }}>{card.desc}</span>
              <span className="text-xs" style={{ color: '#8B6550' }}>{card.sub}</span>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-5 md:px-10">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display font-extrabold text-2xl text-[#1A0F0A] mb-10 text-center">
            Časté otázky
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Pro adoptéry */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🐾</span>
                <h3 className="font-display font-extrabold text-lg text-[#1A0F0A]">Pro adoptéry</h3>
              </div>
              <div className="space-y-2">
                {FAQ_ADOPTERS.map(item => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>

            {/* Pro instituce */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🏠</span>
                <h3 className="font-display font-extrabold text-lg text-[#1A0F0A]">Pro útulky</h3>
              </div>
              <div className="space-y-2">
                {FAQ_INSTITUTIONS.map(item => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="kontakt" className="py-16 px-5 md:px-10">
        <div className="max-w-[620px] mx-auto">
          <div className="mb-8 text-center">
            <h2 className="font-display font-extrabold text-2xl text-[#1A0F0A] mb-2">
              Nenašel jsi odpověď?
            </h2>
            <p className="text-sm" style={{ color: '#8B6550' }}>
              Napiš nám a my se ti ozveme co nejdříve.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#F0EDE8] p-6 md:p-8">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="pb-16 px-5 md:px-10">
        <div className="max-w-[620px] mx-auto">
          <div className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-full border border-[#D4EDDA] bg-[#F0FAF2] w-fit mx-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-[#27AE60] animate-pulse shrink-0" />
            <span className="text-sm font-medium" style={{ color: '#1E7E34' }}>
              Všechny systémy fungují normálně
            </span>
          </div>
        </div>
      </section>

    </main>
  )
}
