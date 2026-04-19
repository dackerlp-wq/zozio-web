'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function PortalLogout() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors hover:bg-[#F0EDE8]"
      style={{ color: '#8B6550', background: 'transparent' }}>
      Odhlásit
    </button>
  )
}
