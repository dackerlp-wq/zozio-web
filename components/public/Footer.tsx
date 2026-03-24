import Link from 'next/link'
import { ZozLogo } from '@/components/ui/ZozLogo'

export function Footer() {
  return (
    <footer className="bg-espresso px-12 pt-16 pb-8 text-gray">
      <div className="max-w-[1100px] mx-auto grid grid-cols-4 gap-12 mb-11">

        <div>
          <ZozLogo size="md" variant="inverted" />
          <p className="text-sm text-gray leading-relaxed mt-3 max-w-[260px]">
            Platforma pro útulky a záchranné stanice v ČR a SR.
            Zachraňme opuštěná i ohrožená zvířata.
          </p>
          <p className="text-xs text-gray/60 mt-4 font-semibold italic">
            „Lidé volají SOS — zvířata volají ZOZ."
          </p>
        </div>

        <div>
          <h4 className="font-display font-extrabold text-xs text-white mb-4 uppercase tracking-widest">
            Pro rodiny
          </h4>
          <ul className="list-none space-y-2.5">
            {[
              { href: '/adopt',        label: 'Adoptovat psa' },
              { href: '/adopt',        label: 'Adoptovat kočku' },
              { href: '/rescue',       label: 'Záchranné stanice' },
              { href: '/institutions', label: 'Adresář útulků' },
              { href: '/fundraisers',  label: 'Sbírky' },
            ].map(({ href, label }) => (
              <li key={label}>
                <Link href={href} className="text-sm text-gray hover:text-coral transition-colors no-underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display font-extrabold text-xs text-white mb-4 uppercase tracking-widest">
            Pro instituce
          </h4>
          <ul className="list-none space-y-2.5">
            {[
              { href: '/auth/register?type=shelter',        label: 'Registrovat útulok' },
              { href: '/auth/register?type=rescue_station', label: 'Záchranná stanice' },
              { href: '/pricing',      label: 'Ceník' },
              { href: '/auth/login',   label: 'Přihlásit se' },
            ].map(({ href, label }) => (
              <li key={label}>
                <Link href={href} className="text-sm text-gray hover:text-coral transition-colors no-underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display font-extrabold text-xs text-white mb-4 uppercase tracking-widest">
            Zozio
          </h4>
          <ul className="list-none space-y-2.5">
            {[
              { href: '/pricing', label: 'Ceník' },
              { href: 'mailto:info@zozio.cz', label: 'Kontakt' },
              { href: '#', label: 'Ochrana osobních údajů' },
              { href: '#', label: 'Podmínky použití' },
            ].map(({ href, label }) => (
              <li key={label}>
                <Link href={href} className="text-sm text-gray hover:text-coral transition-colors no-underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto pt-6 border-t border-white/[0.07] flex justify-between items-center text-xs">
        <span>© 2026 Zozio s.r.o. · Vyrobeno s ❤️ v České republice</span>
        <ZozLogo size="sm" variant="inverted" />
      </div>
    </footer>
  )
}
