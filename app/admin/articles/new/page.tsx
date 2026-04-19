import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { ArticleEditor } from '@/components/admin/ArticleEditor'

export default async function NewArticlePage() {
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
      </div>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso mb-8">
        📝 Nový článek
      </h1>
      <ArticleEditor
        institutionId={institution.id}
        mode="create"
        animals={(animalsData ?? []) as any[]}
      />
    </div>
  )
}
