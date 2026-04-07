'use client'
import { useState } from 'react'

interface WidgetGeneratorProps {
  slug: string
  isShelter: boolean
}

export function WidgetGenerator({ slug, isShelter }: WidgetGeneratorProps) {
  const [type, setType]     = useState(isShelter ? 'adopt' : 'adopt')
  const [limit, setLimit]   = useState('6')
  const [lang, setLang]     = useState('cs')
  const [species, setSpecies] = useState('')
  const [copied, setCopied] = useState(false)

  const attrs = [
    `  data-id="${slug}"`,
    `  data-type="${type}"`,
    `  data-limit="${limit}"`,
    lang !== 'cs' ? `  data-lang="${lang}"` : null,
    species ? `  data-species="${species}"` : null,
  ].filter(Boolean).join('\n')

  const code = `<script\n${attrs}\n  src="https://www.zozio.cz/widget.js"\n  defer\n></script>`

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const inputCls = 'w-full border border-[#E8DDD5] rounded-xl px-3 py-2 text-sm font-semibold text-[#2C1810] bg-white focus:outline-none focus:border-[#E8634A] focus:ring-2 focus:ring-[#E8634A]/20'

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-[#2C1810] mb-1.5">Co zobrazit</label>
          <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
            <option value="adopt">Zvířata hledající domov</option>
            <option value="adopted">Zvířata, která domov našla</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#2C1810] mb-1.5">Počet zvířat</label>
          <select value={limit} onChange={e => setLimit(e.target.value)} className={inputCls}>
            <option value="3">3 zvířata</option>
            <option value="6">6 zvířat (doporučeno)</option>
            <option value="9">9 zvířat</option>
            <option value="12">12 zvířat</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#2C1810] mb-1.5">Jazyk</label>
          <select value={lang} onChange={e => setLang(e.target.value)} className={inputCls}>
            <option value="cs">Čeština</option>
            <option value="sk">Slovenština</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#2C1810] mb-1.5">
            Filtr druhu <span className="font-normal text-[#8B6550]">(nepovinné)</span>
          </label>
          <input
            type="text"
            value={species}
            onChange={e => setSpecies(e.target.value)}
            placeholder="např. pes, kočka, sova…"
            className={inputCls}
          />
        </div>
      </div>

      {/* Code preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#2C1810]">Váš kód</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border-none"
            style={{ background: copied ? '#2E9E8F' : '#E8634A', color: '#fff' }}
          >
            {copied ? '✓ Zkopírováno!' : '📋 Kopírovat'}
          </button>
        </div>
        <pre className="bg-[#2C1810] text-[#F5E6D3] rounded-2xl p-4 text-sm overflow-x-auto leading-relaxed font-mono select-all whitespace-pre-wrap break-all">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
