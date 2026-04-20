import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import type { AdCompany } from '@/types/database'

export const revalidate = 0

export default async function SuperadminAdsCompaniesPage() {
  const service = createServiceClient()

  const { data: companies } = await service
    .from('ad_companies')
    .select('*')
    .order('created_at', { ascending: false })

  const allCompanies = (companies ?? []) as AdCompany[]

  // Počet reklam pro každou firmu
  const { data: adCounts } = await service
    .from('ads')
    .select('company_id')
    .not('company_id', 'is', null)

  const countMap: Record<string, number> = {}
  for (const row of adCounts ?? []) {
    if (row.company_id) {
      countMap[row.company_id] = (countMap[row.company_id] ?? 0) + 1
    }
  }

  return (
    <div>
      {/* Top bar */}
      <div className="bg-espresso px-8 py-4 flex items-center gap-3 -mx-4 md:-mx-8 -mt-6 md:-mt-8 mb-8">
        <Link href="/superadmin/ads" className="text-xs text-gray-light hover:text-white font-semibold transition-colors">
          ← Reklamy
        </Link>
        <span className="text-gray-light/40">·</span>
        <span className="font-display font-bold text-sm text-amber">🏢 Inzerenti</span>
      </div>

      <div className="mb-6">
        <h1 className="font-display font-extrabold text-3xl mb-1" style={{ color: '#2C1810' }}>
          Firmy inzerentů
        </h1>
        <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
          Přehled všech firem registrovaných v portálu inzerentů
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#F0EDE8' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="font-display font-bold text-base" style={{ color: '#2C1810' }}>
            Všechny firmy ({allCompanies.length})
          </h2>
        </div>

        {allCompanies.length === 0 ? (
          <div className="py-16 text-center text-sm font-medium" style={{ color: '#8B6550' }}>
            Zatím žádné firmy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: '#F0EDE8', background: '#FFFCF8' }}>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Firma</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Email</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>IČO</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Stav</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-right" style={{ color: '#8B6550' }}>Reklamy</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Registrace</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F0EDE8' }}>
                {allCompanies.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold" style={{ color: '#2C1810' }}>{company.company_name}</div>
                      {company.contact_name && (
                        <div className="text-xs" style={{ color: '#8B6550' }}>{company.contact_name}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#8B6550' }}>{company.contact_email}</td>
                    <td className="px-3 py-3 text-xs font-mono" style={{ color: '#8B6550' }}>{company.ico ?? '—'}</td>
                    <td className="px-3 py-3">
                      {company.approved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                          Schválena
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: '#FEF9E7', color: '#854F0B' }}>
                          Čeká
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold" style={{ color: '#2C1810' }}>
                      {countMap[company.id] ?? 0}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: '#8B6550' }}>
                      {new Date(company.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/superadmin/ads/companies/${company.id}`}
                        className="text-xs font-semibold no-underline hover:underline"
                        style={{ color: '#E8634A' }}>
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
