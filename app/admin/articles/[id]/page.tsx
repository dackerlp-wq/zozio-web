import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import { ArticleEditor } from '@/components/admin/ArticleEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params
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

  const { data: institution } = await service
    .from('institutions')
    .select('id, type')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) redirect('/admin/dashboard')

  const { data: article } = await service
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!article) notFound()

  const { data: animalsData } = await service
    .from('animals')
    .select('id, name')
    .eq('institution_id', institution.id)
    .eq('published', true)
    .order('name')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/articles" className="text-sm text-gray hover:text-coral transition-colors font-semibold">
          ← Zpět na články
        </a>
        {article.published && (
          <a href={`/articles/${article.slug}`} target="_blank"
            className="text-sm text-coral hover:text-coral-dark font-semibold transition-colors">
            Zobrazit na webu ↗
          </a>
        )}
      </div>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-8">
        Upravit článek
      </h1>
      <ArticleEditor
        institutionId={institution.id}
        mode="edit"
        article={article}
        animals={(animalsData ?? []) as any[]}
      />
    </div>
  )
}
