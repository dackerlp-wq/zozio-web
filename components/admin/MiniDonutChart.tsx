'use client'

export interface DonutChartItem {
  label: string
  value: number
  color: string
}

interface MiniDonutChartProps {
  data: DonutChartItem[]
  size?: number
}

export default function MiniDonutChart({ data, size = 120 }: MiniDonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return null

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38          // outer radius
  const ir = size * 0.22         // inner radius (donut hole)
  const circumference = 2 * Math.PI * r

  // Build arc segments
  let offset = 0
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const fraction = d.value / total
      const strokeDasharray = `${fraction * circumference} ${circumference}`
      const rotate = offset * 360 - 90   // -90 starts from top
      offset += fraction
      return { ...d, strokeDasharray, rotate }
    })

  return (
    <div className="flex flex-col items-center gap-3">
      {/* SVG donut */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-0"
          aria-hidden="true"
        >
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={r - ir}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={0}
              transform={`rotate(${seg.rotate} ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray .5s ease' }}
            />
          ))}
        </svg>
        {/* centre total */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          aria-label={`Celkem ${total}`}
        >
          <span className="font-display font-extrabold text-espresso" style={{ fontSize: size * 0.18 }}>
            {total}
          </span>
          <span className="font-body text-gray uppercase tracking-wide" style={{ fontSize: size * 0.09 }}>
            celkem
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {data
          .filter((d) => d.value > 0)
          .map((d, i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                className="inline-block rounded-pill shrink-0"
                style={{ width: 8, height: 8, backgroundColor: d.color }}
              />
              <span className="font-body text-xs text-gray">{d.label}</span>
              <span className="font-body font-bold text-xs text-espresso">{d.value}</span>
            </div>
          ))}
      </div>
    </div>
  )
}
