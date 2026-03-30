import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Příběhy adopcí a záchran | Zozio',
  description: 'Čtěte příběhy úspěšných adopcí a záchran zvířat z celé ČR a SR.',
}

export default async function ArticlesPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(12)

  const items = articles ?? []

  // Statické ukázkové příběhy pokud není nic v DB
  const staticStories = [
    { id: '1', title: 'Max našel svůj domov', perex: 'Po třech měsících v útulku si Maxe adoptovala rodina z Prahy. Dnes žije na chatě se dvěma dětmi.', category: 'story', emoji: '🐕', institution: 'Útulok Praha Chodov' },
    { id: '2', title: 'Výr Vocálko se vrátil do přírody', perex: 'Přijeli k nám s přebitým křídlem. Po třech měsících rehabilitace se Vocálko vrátil do lesů u Jihlavy.', category: 'rescue', emoji: '🦉', institution: 'Záchranná stanice Jihlava' },
    { id: '3', title: 'Luna — z bázlivé kočky na královnu bytu', perex: 'Luna přišla do útulku podvyživená a bázlivá. Dnes žije v bytě v Brně a je absolutní vládkyní pohovky.', category: 'story', emoji: '🐱', institution: 'Kočičí azyl Ostrava' },
    { id: '4', title: 'Lišák Ryšavák přežil otravu', perex: 'Byl nalezen u průmyslové zóny v kritickém stavu. Díky rychlé léčbě se uzdravil a vrátil do přírody.', category: 'rescue', emoji: '🦊', institution: 'ČSOP Plzeň' },
    { id: '5', title: 'Fífa — malá dáma s velkým srdcem', perex: 'Tiny jorkšírská teriérka, která v útulku nevěřila lidem. Dnes je neodmyslitelnou součástí rodiny se třemi dětmi.', category: 'story', emoji: '🐕', institution: 'Psí útulek Brno' },
    { id: '6', title: 'Ježeček se probudil ze zimního spánku', perex: 'Byl nalezen v zahradě v únoru — příliš brzy. Po péči záchranné stanice se koncem dubna vrátil ven.', category: 'rescue', emoji: '🦔', institution: 'Záchranná stanice Jihlava' },
  ]

  const categoryLabel: Record<string, string> = {
    story:  '🐾 Příběh adopce',
    rescue: '🦉 Záchranný příběh',
    tips:   '💡 Tipy',
    news:   '📰 Novinky',
  }

  const categoryColor: Record<string, string> = {
    story:  'bg-coral-light text-coral-dark',
    rescue: 'bg-rescue-bg text-rescue-dark',
    tips:   'bg-amber-light text-warning',
    news:   'bg-sand text-brown-mid',
  }

  return (
    <main className="min-h-screen bg-warm pt-20 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">

        <div className="text-center mb-10 md:mb-12">
          <span className="inline-flex items-center gap-1.5 bg-coral-light text-coral-dark font-body text-xs font-bold px-4 py-1.5 rounded-pill uppercase tracking-wider mb-4">
            📖 Příběhy
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-espresso mb-3 leading-tight">
            Příběhy, které<br className="hidden md:block" /> zahřejí srdce
          </h1>
          <p className="text-base md:text-lg text-brown-mid max-w-[480px] mx-auto leading-relaxed">
            Adopce, záchranné příběhy a novinky ze světa útulků a záchranných stanic.
          </p>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(article => (
              <article key={article.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-pale hover:-translate-y-1 hover:shadow-md transition-all">
                {article.cover_url ? (
                  <div className="h-44 bg-sand">
                    <img src={article.cover_url} alt={article.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-5xl">
                    🐾
                  </div>
                )}
                <div className="p-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold mb-3 ${categoryColor[article.category ?? 'story'] ?? 'bg-sand text-gray'}`}>
                    {categoryLabel[article.category ?? 'story'] ?? '📖 Příběh'}
                  </span>
                  <h2 className="font-display font-extrabold text-lg text-espresso mb-2 leading-tight">{article.title}</h2>
                  {article.perex && <p className="text-sm text-brown-mid leading-relaxed line-clamp-2 mb-3">{article.perex}</p>}
                  <div className="flex items-center justify-between text-xs text-gray">
                    <span>{article.author_name ?? 'Zozio'}</span>
                    {article.published_at && <span>{new Date(article.published_at).toLocaleDateString('cs-CZ')}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          // Statické ukázkové příběhy
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {staticStories.map(s => (
              <article key={s.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-pale hover:-translate-y-1 hover:shadow-md transition-all">
                <div className="h-44 bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-6xl">
                  {s.emoji}
                </div>
                <div className="p-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold mb-3 ${categoryColor[s.category] ?? 'bg-sand text-gray'}`}>
                    {categoryLabel[s.category]}
                  </span>
                  <h2 className="font-display font-extrabold text-lg text-espresso mb-2 leading-tight">{s.title}</h2>
                  <p className="text-sm text-brown-mid leading-relaxed mb-3">{s.perex}</p>
                  <div className="text-xs text-gray">{s.institution}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
