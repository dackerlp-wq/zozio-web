import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/service'

// Přegenerovat každých 12 hodin
export const revalidate = 43200

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  const [animalsData, institutionsData, articlesData, fundraisersData] = await Promise.all([
    supabase
      .from('animals')
      .select('id, updated_at')
      .or('published.eq.true,adoption_status.eq.conditional')
      .in('adoption_status', ['available', 'reserved', 'foster', 'conditional']),
    supabase
      .from('institutions')
      .select('slug, updated_at')
      .eq('approval_status', 'approved'),
    supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('published', true),
    supabase
      .from('fundraisers')
      .select('id, updated_at')
      .eq('active', true),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/adopt`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/institutions`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/fundraisers`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/articles`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/map`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/pricing`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/pro-instituce`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/proc-byt-na-zozio`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const animalRoutes: MetadataRoute.Sitemap = (animalsData.data ?? []).map(a => ({
    url:             `${BASE}/animals/${a.id}`,
    lastModified:    new Date(a.updated_at ?? Date.now()),
    changeFrequency: 'weekly',
    priority:        0.7,
  }))

  const institutionRoutes: MetadataRoute.Sitemap = (institutionsData.data ?? []).map(i => ({
    url:             `${BASE}/institutions/${i.slug}`,
    lastModified:    new Date(i.updated_at ?? Date.now()),
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  const articleRoutes: MetadataRoute.Sitemap = (articlesData.data ?? []).map(a => ({
    url:             `${BASE}/articles/${a.slug}`,
    lastModified:    new Date(a.updated_at ?? Date.now()),
    changeFrequency: 'monthly',
    priority:        0.6,
  }))

  const fundraiserRoutes: MetadataRoute.Sitemap = (fundraisersData.data ?? []).map(f => ({
    url:             `${BASE}/fundraisers/${f.id}`,
    lastModified:    new Date(f.updated_at ?? Date.now()),
    changeFrequency: 'daily',
    priority:        0.7,
  }))

  return [
    ...staticRoutes,
    ...institutionRoutes,
    ...animalRoutes,
    ...articleRoutes,
    ...fundraiserRoutes,
  ]
}
