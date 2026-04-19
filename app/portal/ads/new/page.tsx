import Link from 'next/link'
import { PortalAdForm } from '../PortalAdForm'

export default function NewAdPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/portal/ads" className="no-underline font-semibold hover:opacity-70" style={{ color: '#8B6550' }}>
          ← Moje reklamy
        </Link>
      </div>

      <h1 className="font-display font-extrabold text-3xl mb-6" style={{ color: '#1A0F0A' }}>
        Nová reklama
      </h1>

      <PortalAdForm mode="new" />
    </div>
  )
}
