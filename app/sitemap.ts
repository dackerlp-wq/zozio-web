import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/service'
import { breedSlug } from '@/lib/breed-slug'

// Přegenerovat každých 12 hodin
export const revalidate = 43200

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  const [animalsData, institutionsData, articlesData, fundraisersData, breedsData] = await Promise.all([
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
    supabase
      .from('animal_breeds')
      .select('name_cs, created_at'),
  ])

  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                            lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/adopt`,                 lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/adopt/archiv`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/katalog`,               lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/institutions`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/fundraisers`,           lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/articles`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/map`,                   lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/pricing`,               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/proc-byt-na-zozio`,     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/inzerujte`,             lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/podpora`,               lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/podminky`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/ochrana-dat`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
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

  // Katalog — deduplicate by slug (different name_cs variants can collapse to same slug)
  const breedSlugs = new Map<string, Date>()
  for (const b of (breedsData.data ?? [])) {
    const slug = breedSlug(b.name_cs)
    const existing = breedSlugs.get(slug)
    const ts = b.created_at ? new Date(b.created_at) : now
    if (!existing || ts > existing) breedSlugs.set(slug, ts)
  }
  const breedRoutes: MetadataRoute.Sitemap = [...breedSlugs.entries()].map(([slug, ts]) => ({
    url:             `${BASE}/katalog/${slug}`,
    lastModified:    ts,
    changeFrequency: 'monthly',
    priority:        0.6,
  }))

  return [
    ...staticRoutes,
    ...institutionRoutes,
    ...animalRoutes,
    ...breedRoutes,
    ...articleRoutes,
    ...fundraiserRoutes,
  ]
}
