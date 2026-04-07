import Link from 'next/link'

interface StatCardProps {
  icon: string
  label: string
  value: number | string
  sub?: string
  trend?: number
  color?: string
  href?: string
}

export function StatCard({ icon, label, value, sub, trend, color = '#2C1810', href }: StatCardProps) {
  const card = (
    <div className={`bg-white rounded-2xl border border-[#F0EDE8] p-5 shadow-sm${href ? ' hover:-translate-y-0.5 hover:shadow-md transition-all' : ''}`}>
      {/* Top row: icon + trend badge */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
            style={
              trend > 0
                ? { backgroundColor: '#E6F7ED', color: '#2A7D4F' }
                : trend < 0
                ? { backgroundColor: '#FDEAE6', color: '#993C1D' }
                : { backgroundColor: '#F5F0EC', color: '#8B6550' }
            }
          >
            {trend > 0 ? `↑ +${trend}%` : trend < 0 ? `↓ ${trend}%` : '→'}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="font-display font-extrabold text-3xl" style={{ color }}>
        {value}
      </div>

      {/* Label */}
      <div className="text-sm font-bold text-[#8B6550] mt-0.5">{label}</div>

      {/* Sub */}
      {sub && <div className="text-xs text-[#8B6550] mt-1">{sub}</div>}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="no-underline block">
        {card}
      </Link>
    )
  }

  return card
}
