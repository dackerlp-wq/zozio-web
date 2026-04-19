import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PortalAdForm } from '../PortalAdForm'
import type { Ad } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0

export default async function EditAdPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const service = createServiceClient()
  const { data, error } = await service
    .from('ads')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const ad = data as Ad

  // Verify ownership
  const { data: company } = await supabase
    .from('ad_companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company || ad.company_id !== company.id) notFound()

  const canEdit = ad.status === 'draft' || ad.status === 'rejected'

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/portal/ads" className="no-underline font-semibold hover:opacity-70" style={{ color: '#8B6550' }}>
          ← Moje reklamy
        </Link>
      </div>

      <h1 className="font-display font-extrabold text-3xl mb-2" style={{ color: '#1A0F0A' }}>
        {ad.headline}
      </h1>
      <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
        {canEdit ? 'Upravo reklamu a odešlete ke schválení.' : 'Reklama není ve stavu, který lze upravovat.'}
      </p>

      {canEdit ? (
        <PortalAdForm mode="edit" initial={ad} />
      ) : (
        <div>
          {/* Read-only view */}
          <div className="bg-white rounded-xl border p-6 mb-4" style={{ borderColor: '#F0EDE8' }}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6550' }}>Headline</p>
                <p style={{ color: '#1A0F0A' }}>{ad.headline}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6550' }}>CTA</p>
                <p style={{ color: '#1A0F0A' }}>{ad.cta_label} → {ad.cta_url}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6550' }}>Období</p>
                <p style={{ color: '#1A0F0A' }}>{ad.active_from} — {ad.active_to}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6550' }}>Sloty</p>
                <p style={{ color: '#1A0F0A' }}>{ad.slots.join(', ')}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/portal/ads"
              className="px-4 py-2 rounded-lg text-sm font-semibold no-underline"
              style={{ background: '#F0EDE8', color: '#6B4030' }}>
              ← Zpět na seznam
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
