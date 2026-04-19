import Link from 'next/link'

interface AnimalRowProps {
  id: string
  name?: string | null
  caseNumber?: string | null
  speciesIcon?: string
  speciesName?: string
  status: string
  intakeDate?: string | null
  urgent?: boolean
  href: string
}

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  available:        { bg: '#E6F7ED', color: '#2A7D4F', label: 'K adopci' },
  reserved:         { bg: '#EEF2FF', color: '#3730A3', label: 'Rezervováno' },
  adopted:          { bg: '#F5F0EC', color: '#8B6550', label: 'Adoptováno' },
  foster:           { bg: '#FEF3CD', color: '#7A5200', label: 'Pěstounská' },
  not_for_adoption: { bg: '#F5F0EC', color: '#8B6550', label: 'Není k adopci' },
  intake:           { bg: '#FDEAE6', color: '#993C1D', label: 'V příjmu' },
  treatment:        { bg: '#FEF3CD', color: '#7A5200', label: 'V léčbě' },
  deceased:         { bg: '#F5F0EC', color: '#8B6550', label: 'Uhynul' },
  conditional:      { bg: '#FFF0E6', color: '#C05000', label: 'Podmíněná adopce' },
}

export function AnimalRow({
  id,
  name,
  caseNumber,
  speciesIcon,
  speciesName,
  status,
  intakeDate,
  urgent,
  href,
}: AnimalRowProps) {
  const badge = statusBadge[status] ?? { bg: '#F5F0EC', color: '#8B6550', label: status }

  return (
    <tr className="border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors">
      {/* Animal/name cell */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: '#F5F0EC' }}
          >
            {speciesIcon ?? '🐾'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[#2C1810]">
                {name ?? caseNumber ?? '—'}
              </span>
              {urgent && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: '#FDEAE6', color: '#993C1D' }}
                >
                  🆘
                </span>
              )}
            </div>
            {name && caseNumber && (
              <div className="text-xs text-[#8B6550]">{caseNumber}</div>
            )}
            {speciesName && (
              <div className="text-xs text-[#8B6550]">{speciesName}</div>
            )}
          </div>
        </div>
      </td>

      {/* Status badge cell */}
      <td className="px-5 py-4">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </td>

      {/* Intake date cell */}
      <td className="px-5 py-4 text-xs text-[#8B6550]">
        {intakeDate ? new Date(intakeDate).toLocaleDateString('cs-CZ') : '—'}
      </td>

      {/* Edit link cell */}
      <td className="px-5 py-4">
        <Link
          href={href}
          className="text-sm font-bold no-underline hover:underline"
          style={{ color: '#E8634A' }}
        >
          Upravit →
        </Link>
      </td>
    </tr>
  )
}
