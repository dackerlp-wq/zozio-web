import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const [animalsData, institutionsData] = await Promise.all([
    supabase.from('animals').select('id, updated_at').eq('published', true).eq('adoption_status', 'available'),
    supabase.from('institutions').select('slug, updated_at').eq('approval_status', 'approved'),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${BASE}/adopt`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/institutions`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/fundraisers`,  lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE}/articles`,     lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/pricing`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/pro-instituce`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  const animalRoutes: MetadataRoute.Sitemap = (animalsData.data ?? []).map(a => ({
    url:              `${BASE}/animals/${a.id}`,
    lastModified:     new Date(a.updated_at ?? Date.now()),
    changeFrequency:  'weekly',
    priority:         0.7,
  }))

  const institutionRoutes: MetadataRoute.Sitemap = (institutionsData.data ?? []).map(i => ({
    url:              `${BASE}/institutions/${i.slug}`,
    lastModified:     new Date(i.updated_at ?? Date.now()),
    changeFrequency:  'weekly',
    priority:         0.8,
  }))

  return [...staticRoutes, ...animalRoutes, ...institutionRoutes]
}
