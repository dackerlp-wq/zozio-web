import Link from 'next/link'
import { AdForm } from '../AdForm'

export default function NewAdPage() {
  return (
    <div>
      {/* Top bar */}
      <div className="bg-espresso px-8 py-4 flex items-center gap-3 -mx-4 md:-mx-8 -mt-6 md:-mt-8 mb-8">
        <Link href="/superadmin/ads" className="text-xs text-gray-light hover:text-white font-semibold transition-colors">
          ← Reklamy
        </Link>
        <span className="text-gray-light/40">·</span>
        <span className="font-display font-bold text-sm text-amber">Nová reklama</span>
      </div>

      <div className="mb-6">
        <h1 className="font-display font-extrabold text-3xl mb-1" style={{ color: '#2C1810' }}>
          Přidat reklamu
        </h1>
        <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
          Vyplňte údaje o inzerci a reklamních slotech
        </p>
      </div>

      <AdForm mode="new" />
    </div>
  )
}
