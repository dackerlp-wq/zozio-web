import { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/superadmin/', '/auth/', '/api/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
