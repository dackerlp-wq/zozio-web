'use client'

interface DailyStat {
  day: string
  impressions: number
  clicks: number
}

interface CsvExportButtonProps {
  stats: DailyStat[]
  adName: string
}

export function CsvExportButton({ stats, adName }: CsvExportButtonProps) {
  const handleExport = () => {
    const header = 'Datum,Zobrazení,Kliky,CTR%'
    const rows = stats.map(s => {
      const ctr = s.impressions > 0
        ? ((s.clicks / s.impressions) * 100).toFixed(2)
        : '0.00'
      return `${s.day},${s.impressions},${s.clicks},${ctr}`
    })
    const csv = '\uFEFF' + [header, ...rows].join('\n') // BOM pro Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${adName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-statistiky.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:opacity-80"
      style={{ borderColor: '#E0DDD8', color: '#6B4030', background: 'white' }}
    >
      ↓ Export CSV
    </button>
  )
}
