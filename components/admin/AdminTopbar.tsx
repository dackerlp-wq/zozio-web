'use client'
import Link from 'next/link'

interface AdminTopbarProps {
  institutionName: string | null
  isShelter: boolean | null
  isSuperadmin: boolean
}

export function AdminTopbar({ institutionName, isShelter, isSuperadmin }: AdminTopbarProps) {
  const showCta = !isSuperadmin
  const ctaLabel = isShelter === false ? 'Přijmout pacienta' : 'Přidat zvíře'
  const ctaBg = isShelter === false ? '#2E9E8F' : '#E8634A'

  return (
    <div className="h-14 bg-white border-b border-[#F0EDE8] flex items-center gap-3 px-4 md:px-6">
      {/* Global search — tablet + desktop */}
      <div className="hidden md:flex flex-1 max-w-xs">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] select-none pointer-events-none">🔍</span>
          <input
            type="search"
            placeholder="Hledat..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#F5E6D3] rounded-full font-body text-sm text-[#2C1810] placeholder:text-[#8B6550] outline-none focus:bg-white focus:ring-2 focus:ring-[#E8634A]/20 transition-all border-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {showCta && (
          <Link
            href="/admin/animals/new"
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm text-white no-underline whitespace-nowrap"
            style={{ backgroundColor: ctaBg }}
          >
            + {ctaLabel}
          </Link>
        )}

        {/* Notification bell */}
        <button
          className="hidden md:flex w-9 h-9 rounded-full bg-[#F5E6D3] items-center justify-center text-base cursor-pointer border-none hover:bg-[#EDD8C0] transition-colors"
          title="Oznámení"
        >
          🔔
        </button>
      </div>
    </div>
  )
}
