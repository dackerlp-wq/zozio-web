import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { SendGlobalNewsletter } from './SendGlobalNewsletter'

export default async function SuperadminNewsletterPage() {
  const service = createServiceClient()

  const { data: subscribers } = await service
    .from('newsletter_subscribers')
    .select('id, email, name, subscribed_at')
    .is('institution_id', null)
    .order('subscribed_at', { ascending: false })

  const list = subscribers ?? []

  return (
    <div className="min-h-screen bg-gray-pale/30">
      {/* Top bar */}
      <div className="bg-espresso px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ZozLogo size="sm" variant="inverted" />
          <span className="font-display font-bold text-sm text-amber">⚡ Superadmin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/superadmin" className="text-xs text-gray-light hover:text-white transition-colors font-semibold">← Zpět</Link>
          <Link href="/" className="text-xs text-gray-light hover:text-white transition-colors font-semibold">Web →</Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-extrabold text-4xl text-espresso">Newsletter</h1>
            <p className="text-gray mt-1 font-semibold">{list.length} globálních odběratelů</p>
          </div>
          <SendGlobalNewsletter subscriberCount={list.length} />
        </div>

        {/* Tabulka odběratelů */}
        <div className="bg-white rounded-xl border border-gray-pale shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-pale">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray">#</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray">E-mail</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray">Jméno</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray">Přihlášen</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray text-sm">
                    Zatím žádní odběratelé
                  </td>
                </tr>
              ) : (
                list.map((sub, i) => (
                  <tr key={sub.id} className="border-b border-gray-pale last:border-b-0 hover:bg-gray-pale/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray font-semibold">{i + 1}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-espresso">{sub.email}</td>
                    <td className="px-5 py-3.5 text-sm text-gray">{sub.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray">
                      {new Date(sub.subscribed_at).toLocaleDateString('cs-CZ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
