'use client'
import Link from 'next/link'

interface AdminTopbarProps {
  institutionName: string | null
  isShelter?: boolean | null
  isSuperadmin: boolean
}

export function AdminTopbar({ isSuperadmin }: AdminTopbarProps) {
  const showCta = !isSuperadmin

  return (
    <div className="h-14 bg-white border-b border-[#F0EDE8] flex items-center gap-3 px-4 md:px-6">
      <div className="flex items-center gap-2 ml-auto">
        {showCta && (
          <Link
            href="/admin/animals/new"
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm text-white no-underline whitespace-nowrap"
            style={{ backgroundColor: '#E8634A' }}
          >
            + Přidat zvíře
          </Link>
        )}
      </div>
    </div>
  )
}
