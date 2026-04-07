import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

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

export default async function AdminArticlesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const { data: articles } = await service
    .from('articles')
    .select('id, title, category, published, published_at, created_at, cover_url')
    .eq('institution_id', membership.institution_id)
    .order('created_at', { ascending: false })

  const items = articles ?? []
  const published = items.filter(a => a.published).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso">
            📝 Články a příběhy
          </h1>
          <p className="text-gray mt-1 font-semibold text-sm">
            {items.length} celkem · {published} publikovaných
          </p>
        </div>
        <Link href="/admin/articles/new">
          <Button variant="primary" size="sm">+ Nový článek</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-pale">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="font-display font-bold text-xl text-espresso mb-2">Zatím žádné články</h3>
          <p className="text-gray mb-6 text-sm max-w-[400px] mx-auto">
            Sdílej příběhy adoptovaných zvířat nebo záchranných případů — pomůžou přilákat další adoptivní rodiny.
          </p>
          <Link href="/admin/articles/new">
            <Button variant="primary">+ Napsat první článek</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(article => (
            <div key={article.id} className="bg-white rounded-lg border border-gray-pale shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 p-4 md:p-5">

                {/* Cover mini */}
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-md overflow-hidden bg-sand flex-shrink-0 flex items-center justify-center text-2xl">
                  {article.cover_url
                    ? <Image src={article.cover_url} alt="" fill sizes="64px" className="object-cover" />
                    : <span>{categoryLabel[article.category ?? 'story']?.slice(0, 2)}</span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-bold ${categoryColor[article.category ?? 'story'] ?? 'bg-sand text-gray'}`}>
                      {categoryLabel[article.category ?? 'story'] ?? 'Článek'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-bold ${article.published ? 'bg-success-bg text-success' : 'bg-gray-pale text-gray'}`}>
                      {article.published ? '● Publikováno' : '○ Koncept'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base md:text-lg text-espresso truncate">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray mt-0.5">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
                      : `Vytvořeno ${new Date(article.created_at).toLocaleDateString('cs-CZ')}`
                    }
                  </p>
                </div>

                <Link href={`/admin/articles/${article.id}`} className="flex-shrink-0">
                  <Button variant="sand" size="sm">Upravit</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
