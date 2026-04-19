import Link from 'next/link'
import { ZozLogo } from '@/components/ui/ZozLogo'

export function Footer() {
  return (
    <footer className="bg-espresso px-4 md:px-12 pt-12 md:pt-16 pb-8 text-gray">
      <div className="max-w-[1100px] mx-auto">

        {/* Grid — 1 col mobile, 4 col desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-11">

          <div className="col-span-2 md:col-span-1">
            <ZozLogo size="md" variant="inverted" />
            <p className="text-sm text-gray leading-relaxed mt-3 max-w-[260px]">
              Platforma pro útulky v ČR a SR.
              Zachraňme opuštěná zvířata.
            </p>
            <p className="text-xs text-gray/60 mt-3 font-semibold italic">
              „Lidé volají SOS — zvířata volají ZOZ."
            </p>
          </div>

          <div>
            <h4 className="font-display font-extrabold text-xs text-white mb-3 md:mb-4 uppercase tracking-widest">Pro rodiny</h4>
            <ul className="list-none space-y-2">
              {[
                { href: '/adopt',        label: 'Adoptovat zvíře' },
                { href: '/institutions', label: 'Adresář útulků' },
                { href: '/fundraisers',  label: 'Sbírky' },
                { href: '/map',          label: '🗺️ Mapa útulků' },
                { href: '/katalog',      label: '📖 Katalog ras' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray hover:text-coral transition-colors no-underline">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-extrabold text-xs text-white mb-3 md:mb-4 uppercase tracking-widest">Pro instituce</h4>
            <ul className="list-none space-y-2">
              {[
                { href: '/proc-byt-na-zozio',          label: 'Proč být na Zozio?' },
                { href: '/auth/register?type=shelter', label: 'Registrovat útulek' },
                { href: '/pricing',    label: 'Ceník' },
                { href: '/auth/login', label: 'Přihlásit se' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray hover:text-coral transition-colors no-underline">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-extrabold text-xs text-white mb-3 md:mb-4 uppercase tracking-widest">Zozio</h4>
            <ul className="list-none space-y-2">
              {[
                { href: '/pricing',               label: 'Ceník' },
                { href: '/inzerujte',             label: '📣 Inzerujte' },
                { href: 'mailto:info@zozio.cz',   label: 'Kontakt' },
                { href: '/ochrana-dat', label: 'Ochrana osobních údajů' },
                { href: '/podminky',   label: 'Podmínky použití' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray hover:text-coral transition-colors no-underline">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.07] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <span>© 2026 Zozio s.r.o. · Vyrobeno s ❤️ v České republice</span>
          <ZozLogo size="sm" variant="inverted" />
        </div>
      </div>
    </footer>
  )
}
