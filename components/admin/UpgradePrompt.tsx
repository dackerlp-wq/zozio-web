import Link from 'next/link'
import {
  FEATURE_LABELS,
  FEATURE_MIN_PLAN,
  PLAN_NAMES,
  PLAN_PRICES,
  type PlanFeature,
} from '@/lib/plans'

interface UpgradePromptProps {
  /** Funkce, která je zamknutá */
  feature: PlanFeature
  /** Volitelný custom titulek */
  title?: string
  /** Volitelný popis */
  description?: string
}

/**
 * Fullpage (nebo inline) upgrade prompt — zobrazuje se, když plán instituce
 * nedovoluje přístup k dané funkci.
 */
export function UpgradePrompt({ feature, title, description }: UpgradePromptProps) {
  const minPlan  = FEATURE_MIN_PLAN[feature]
  const planName = PLAN_NAMES[minPlan]
  const price    = PLAN_PRICES[minPlan]
  const label    = FEATURE_LABELS[feature]

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* Lock icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6"
        style={{ background: '#FAECE7' }}
      >
        🔒
      </div>

      {/* Titulek */}
      <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-3">
        {title ?? `${label} — uzamčeno`}
      </h1>

      {/* Popis */}
      <p className="text-sm md:text-base text-[#8B6550] max-w-[480px] mb-2 leading-relaxed">
        {description ?? (
          <>
            Tato funkce je součástí plánu{' '}
            <strong className="text-espresso">{planName}</strong> ({price}).{' '}
            Upgradujte a odemkněte <strong className="text-espresso">{label}</strong> i dalšíněmo funkce.
          </>
        )}
      </p>

      {/* Tlačítka */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
        <Link
          href="/admin/billing"
          className="inline-flex items-center px-6 py-3 rounded-full font-bold text-sm text-white no-underline transition-opacity hover:opacity-90"
          style={{ background: '#E8634A' }}
        >
          Upgradovat na {planName}
        </Link>
        <a
          href="mailto:team@zozio.cz?subject=Zájem o upgrade plánu"
          className="inline-flex items-center px-6 py-3 rounded-full font-bold text-sm no-underline border transition-colors hover:bg-sand"
          style={{ color: '#E8634A', borderColor: '#E8634A' }}
        >
          Kontaktovat podporu
        </a>
      </div>

      {/* Mini comparison */}
      <div
        className="mt-10 rounded-2xl border p-5 md:p-6 max-w-[480px] w-full text-left"
        style={{ borderColor: '#F0EDE8', background: '#FFFCF8' }}
      >
        <div className="text-xs font-bold text-[#8B6550] uppercase tracking-widest mb-4">
          Plán {planName} zahrnuje
        </div>
        <ul className="space-y-2">
          {PLAN_HIGHLIGHTS[minPlan].map(f => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-espresso">
              <span className="text-[#2E9E8F] font-bold">✓</span>
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t flex items-baseline gap-2" style={{ borderColor: '#F0EDE8' }}>
          <span className="font-display font-extrabold text-2xl text-espresso">
            {minPlan === 'free' ? 'Zdarma' : price.split(' /')[0]}
          </span>
          {minPlan !== 'free' && (
            <span className="text-sm text-[#8B6550]">/ měsíc bez DPH</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Kratší seznam highlights pro každý plán (pro mini tabulku v UpgradePrompt)
const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  free: [
    'Do 20 zvířat',
    'Veřejný profil útulku',
    'Adopční žádosti',
    'Základní statistiky',
  ],
  standard: [
    'Neomezená zvířata',
    'E-mail notifikace',
    'Sbírky (Darujme.cz)',
    'Správa dobrovolníků',
    'Newsletter',
    'Export CSV',
    'Pokročilé statistiky',
    'Embed widget',
  ],
  pro: [
    'Vše ze Standard',
    'Správa poboček',
    'Prioritní zobrazení v katalogu',
    'Pokročilé reporty',
    'Onboarding asistence',
    'Prioritní podpora (SLA)',
  ],
}
