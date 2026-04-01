'use client'

export interface BarChartItem {
  label: string
  value: number
  color?: string
}

interface MiniBarChartProps {
  data: BarChartItem[]
  height?: number
}

export default function MiniBarChart({ data, height = 160 }: MiniBarChartProps) {
  if (!data.length) return null

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div style={{ minHeight: height }} className="flex flex-col justify-end gap-2">
      {data.map((item, i) => {
        const pct = Math.round((item.value / maxValue) * 100)
        const barColor = item.color ?? 'bg-coral'
        return (
          <div key={i} className="flex items-center gap-2 group">
            {/* label */}
            <span
              className="font-body text-xs text-gray shrink-0 text-right"
              style={{ width: '6.5rem' }}
              title={item.label}
            >
              {item.label}
            </span>

            {/* bar track */}
            <div className="flex-1 h-5 bg-gray-pale rounded-pill overflow-hidden relative">
              <div
                className={`h-full ${barColor} rounded-pill transition-all duration-500 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* value */}
            <span className="font-display font-bold text-xs text-espresso shrink-0 w-6 text-right">
              {item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
