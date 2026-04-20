import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ProfilTabs } from '@/components/public/ProfilTabs'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/profil')

  const service = createServiceClient()

  const [
    { data: favAnimals },
    { data: favInstitutions },
    { data: volunteers },
    { data: newsletterRow },
    { data: myApplications },
  ] = await Promise.all([
    supabase
      .from('animal_favorites')
      .select('animal_id, created_at, animal:animals(id, name, primary_photo, adoption_status, species:animal_species(name_cs, icon), institution:institutions(name, city, slug))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('institution_favorites')
      .select('institution_id, created_at, institution:institutions(id, name, slug, type, city, logo_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('volunteers')
      .select('id, status, created_at, activities, availability_data, institution:institutions(id, name, slug, type, city, logo_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    service
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', user.email!)
      .is('institution_id', null)
      .maybeSingle(),

    service
      .from('adoption_applications')
      .select('id, status, created_at, updated_at, meeting_options, meeting_at, institution_note, animal:animals(id, name, primary_photo, species:animal_species(name_cs, icon)), institution:institutions(id, name, slug)')
      .or(`user_id.eq.${user.id},applicant_email.eq.${user.email}`)
      .order('created_at', { ascending: false }),
  ])

  const favInstIds = (favInstitutions ?? []).map((f: any) => f.institution_id)

  const [{ data: newAnimals }, { data: newArticles }] = await Promise.all([
    favInstIds.length
      ? supabase
          .from('animals')
          .select('id, name, primary_photo, adoption_status, created_at, species:animal_species(name_cs, icon), institution:institutions(name, slug)')
          .in('institution_id', favInstIds)
          .eq('published', true)
          .eq('adoption_status', 'available')
          .order('created_at', { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),

    favInstIds.length
      ? supabase
          .from('articles')
          .select('id, title, slug, perex, cover_url, published_at, institution:institutions(name, slug)')
          .in('institution_id', favInstIds)
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <main className="min-h-screen pt-16 md:pt-20 pb-16" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[640px] mx-auto px-4 sm:px-5 flex flex-col">
        <ProfilTabs
          user={{ email: user.email ?? '', user_metadata: user.user_metadata }}
          favAnimals={favAnimals ?? []}
          favInstitutions={favInstitutions ?? []}
          volunteers={volunteers ?? []}
          newAnimals={newAnimals ?? []}
          newArticles={newArticles ?? []}
          newsletterSubscribed={!!newsletterRow}
          myApplications={myApplications ?? []}
        />
      </div>
    </main>
  )
}
