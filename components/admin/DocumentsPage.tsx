'use client'
import { useState } from 'react'

export interface AnimalOption {
  id: string
  name: string
  intake_date?: string | null
  adoption_status?: string | null
}

interface DocTypeConfig {
  id: string
  icon: string
  title: string
  description: string
  requiresAnimal: boolean
  requiresDates: boolean
}

const DOC_TYPES: DocTypeConfig[] = [
  {
    id: 'animal-card',
    icon: '📋',
    title: 'Veterinární karta zvířete',
    description: 'Povinná evidence dle §25 zák. 246/1992 Sb. — identifikace, zdraví, karanténa',
    requiresAnimal: true,
    requiresDates: false,
  },
  {
    id: 'handover-protocol',
    icon: '🤝',
    title: 'Předávací protokol',
    description: 'Protokol o předání zvířete novému majiteli (adopce)',
    requiresAnimal: true,
    requiresDates: false,
  },
  {
    id: 'intake-list',
    icon: '📥',
    title: 'Příjmový list',
    description: 'Evidence přijatých zvířat za zvolené období',
    requiresAnimal: false,
    requiresDates: true,
  },
  {
    id: 'exit-list',
    icon: '📤',
    title: 'Výstupní list',
    description: 'Evidence odchozích zvířat (adopce, úhyn, převod) za zvolené období',
    requiresAnimal: false,
    requiresDates: true,
  },
  {
    id: 'summary-report',
    icon: '📊',
    title: 'Přehledová zpráva',
    description: 'Souhrnný statistický přehled provozu útulku za dané období',
    requiresAnimal: false,
    requiresDates: true,
  },
  {
    id: 'found-animals',
    icon: '🔍',
    title: 'Evidence nalezených zvířat',
    description: 'Záznamy o nalezených zvířatech pro obecní úřad / KVS',
    requiresAnimal: false,
    requiresDates: true,
  },
]

interface DocumentsPageProps {
  animals: AnimalOption[]
  institutionName: string
  institutionId: string
}

export default function DocumentsPage({
  animals,
  institutionName,
  institutionId,
}: DocumentsPageProps) {
  const coral = '#E8634A'

  const availableTypes = DOC_TYPES

  const [selectedAnimals, setSelectedAnimals] = useState<Record<string, string>>({})
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  function generate(doc: DocTypeConfig) {
    const params = new URLSearchParams()
    if (doc.requiresAnimal) {
      const animalId = selectedAnimals[doc.id]
      if (!animalId) {
        alert('Nejprve vyberte zvíře ze seznamu.')
        return
      }
      params.set('animalId', animalId)
    }
    if (doc.requiresDates) {
      params.set('dateFrom', dateFrom)
      params.set('dateTo', dateTo)
    }
    params.set('inst', institutionName)
    params.set('institutionId', institutionId)
    window.open(`/admin/documents/print/${doc.id}?${params.toString()}`, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-black" style={{ fontSize: '22px', color: '#2C1810' }}>
            📄 Dokumenty
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#8B6550' }}>
            Generování úředních dokumentů a výkazů pro KVS a archiv
          </p>
        </div>
      </div>

      {/* Date range filter */}
      <div
        className="rounded-xl mb-6"
        style={{ background: 'white', border: '1px solid #F0EDE8', padding: '16px 20px' }}
      >
        <div className="font-black text-sm mb-3" style={{ color: '#2C1810' }}>
          📅 Rozsah dat (pro listové dokumenty)
        </div>
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#8B6550' }}>Od</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm font-bold"
              style={{ border: '2px solid #F0EDE8', color: '#2C1810', outline: 'none', background: 'white' }}
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: '#8B6550' }}>Do</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm font-bold"
              style={{ border: '2px solid #F0EDE8', color: '#2C1810', outline: 'none', background: 'white' }}
            />
          </div>
          <div className="text-xs" style={{ color: '#8B6550', paddingBottom: '10px' }}>
            Zvolený rozsah: <strong style={{ color: '#2C1810' }}>{czDate(dateFrom)} — {czDate(dateTo)}</strong>
          </div>
        </div>
      </div>

      {/* Document cards */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}
      >
        {availableTypes.map(doc => (
          <div
            key={doc.id}
            className="rounded-xl flex flex-col"
            style={{ background: 'white', border: '2px solid #F0EDE8', padding: '20px' }}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{doc.icon}</div>
            <div className="font-black mb-1" style={{ fontSize: '15px', color: '#2C1810' }}>
              {doc.title}
            </div>
            <div className="text-xs mb-4 flex-1" style={{ color: '#8B6550', lineHeight: 1.5 }}>
              {doc.description}
            </div>

            {doc.requiresAnimal && (
              <div className="mb-3">
                <label className="text-xs font-bold block mb-1" style={{ color: '#8B6550' }}>
                  Vybrat zvíře
                </label>
                <select
                  value={selectedAnimals[doc.id] ?? ''}
                  onChange={e =>
                    setSelectedAnimals(prev => ({ ...prev, [doc.id]: e.target.value }))
                  }
                  className="w-full rounded-lg px-3 py-2 text-sm font-bold"
                  style={{
                    border: '2px solid #F0EDE8',
                    color: '#2C1810',
                    outline: 'none',
                    background: 'white',
                  }}
                >
                  <option value="">— Vyberte zvíře —</option>
                  {animals.map(a => (
                    <option key={a.id} value={a.id}>
                      {String(a.name)}
                      {a.intake_date ? ` (příjem: ${a.intake_date.slice(0, 10)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {doc.requiresDates && (
              <div
                className="text-xs mb-3 rounded-lg px-3 py-2"
                style={{ background: '#F7F4F0', color: '#8B6550' }}
              >
                Rozsah: <strong>{czDate(dateFrom)}</strong> — <strong>{czDate(dateTo)}</strong>
              </div>
            )}

            <button
              onClick={() => generate(doc)}
              className="w-full rounded-lg font-black text-white text-sm py-2.5 hover:opacity-90 transition-opacity cursor-pointer border-none mt-auto"
              style={{ background: coral }}
            >
              📄 Generovat PDF
            </button>
          </div>
        ))}
      </div>

      {/* Help note */}
      <div
        className="mt-8 rounded-xl text-sm"
        style={{ background: 'white', border: '1px solid #F0EDE8', padding: '16px 20px', color: '#8B6550' }}
      >
        <strong style={{ color: '#2C1810' }}>Jak generovat PDF:</strong> Klikněte na{' '}
        <em>Generovat PDF</em> — otevře se nová záložka s dokumentem. Použijte{' '}
        <strong>Ctrl+P</strong> (nebo tlačítko Tisk) a zvolte <em>Uložit jako PDF</em> nebo tisknout
        přímo.
      </div>
    </div>
  )
}

function czDate(d: string): string {
  if (!d) return '—'
  const parts = d.split('-')
  if (parts.length !== 3) return d
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}
