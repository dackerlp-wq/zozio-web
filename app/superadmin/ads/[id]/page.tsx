import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { AdForm } from '../AdForm'
import type { Ad } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditAdPage({ params }: PageProps) {
  const { id } = await params
  const service = createServiceClient()

  const { data, error } = await service
    .from('ads')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const ad = data as Ad

  return (
    <div>
      {/* Top bar */}
      <div className="bg-espresso px-8 py-4 flex items-center gap-3 -mx-4 md:-mx-8 -mt-6 md:-mt-8 mb-8">
        <Link href="/superadmin/ads" className="text-xs text-gray-light hover:text-white font-semibold transition-colors">
          ← Reklamy
        </Link>
        <span className="text-gray-light/40">·</span>
        <span className="font-display font-bold text-sm text-amber">Upravit reklamu</span>
      </div>

      <div className="mb-6">
        <h1 className="font-display font-extrabold text-3xl mb-1" style={{ color: '#2C1810' }}>
          {ad.company_name}
        </h1>
        <p className="text-sm font-medium" style={{ color: '#8B6550' }}>
          {ad.headline}
        </p>
      </div>

      <AdForm mode="edit" initial={ad} />
    </div>
  )
}
