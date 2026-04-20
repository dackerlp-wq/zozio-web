'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export interface CatalogBreed {
  name: string
  slug: string
  count: number
  fciGroup: string | null
  originalName: string | null
  officialAbbreviation: string | null
}

export interface CatalogSpecies {
  id: string
  name_cs: string
  icon: string | null
  animalCount: number
  breeds: CatalogBreed[]
}

const DOG_GROUP_LABELS: Record<string, string> = {
  I:    'I. Ovčáci a honáčtí psi',
  II:   'II. Pinčové, knírači, molossové',
  III:  'III. Teriéři',
  IV:   'IV. Jezevčíci',
  V:    'V. Špicové a primitivní typy',
  VI:   'VI. Honiči a barváři',
  VII:  'VII. Ohaři',
  VIII: 'VIII. Retrívři, slidiči, vodní psi',
  IX:   'IX. Společenská plemena a toy',
  X:    'X. Chrti',
  unrecognized: 'Neuznaná FCI',
  other: 'Ostatní',
}

const CAT_GROUP_LABELS: Record<string, string> = {
  I:    'I. Perské a exotické',
  II:   'II. Polodlouhosrsté',
  III:  'III. Krátkosrsté a somálské',
  IV:   'IV. Siamské a orientální',
  unrecognized: 'Neuznaná FIFe',
  other: 'Ostatní',
}

const DOG_ORDER = ['I','II','III','IV','V','VI','VII','VIII','IX','X','unrecognized','other'] as const
const CAT_ORDER = ['I','II','III','IV','unrecognized','other'] as const

const DOG_NAMES = ['pes', 'psi', 'psy']
const CAT_NAMES = ['kočka', 'kočky', 'kocka']

function hasAny(speciesName: string, list: string[]) {
  const n = speciesName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return list.some(d => n.includes(d.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
}

function isDog(speciesName: string) { return hasAny(speciesName, DOG_NAMES) }
function isCat(speciesName: string) { return hasAny(speciesName, CAT_NAMES) }

export function CatalogBrowser({ species }: { species: CatalogSpecies[] }) {
  const [selectedSpecies, setSelectedSpecies] = useState<string>(species[0]?.id ?? '')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  const current = species.find(s => s.id === selectedSpecies) ?? species[0]

  const isDogSpecies = current ? isDog(current.name_cs) : false
  const isCatSpecies = current ? isCat(current.name_cs) : false
  const useGroups = isDogSpecies || isCatSpecies
  const labels = isDogSpecies ? DOG_GROUP_LABELS : CAT_GROUP_LABELS
  const registryName = isDogSpecies ? 'FCI' : 'FIFe'

  const groupedBreeds = useMemo(() => {
    if (!current) return [] as { group: string; breeds: CatalogBreed[] }[]
    const groups: Record<string, CatalogBreed[]> = {}
    for (const b of current.breeds) {
      const key = useGroups ? (b.fciGroup ?? 'other') : 'all'
      if (!groups[key]) groups[key] = []
      groups[key].push(b)
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'cs'))
    }
    const order: readonly string[] = isDogSpecies
      ? DOG_ORDER
      : isCatSpecies
        ? CAT_ORDER
        : ['all']
    return order
      .filter(g => groups[g]?.length)
      .map(g => ({ group: g, breeds: groups[g] }))
  }, [current, isDogSpecies, isCatSpecies, useGroups])

  const availableGroupsForFilter = useMemo(() => {
    if (!useGroups) return []
    return groupedBreeds.map(g => g.group)
  }, [groupedBreeds, useGroups])

  const visibleGroups = selectedGroup === 'all'
    ? groupedBreeds
    : groupedBreeds.filter(g => g.group === selectedGroup)

  if (!current) return null

  return (
    <div>
      {/* Species tabs */}
      {species.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {species.map(sp => {
            const active = sp.id === selectedSpecies
            return (
              <button
                key={sp.id}
                onClick={() => { setSelectedSpecies(sp.id); setSelectedGroup('all') }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: active ? '#1A0F0A' : 'white',
                  color: active ? 'white' : '#1A0F0A',
                  border: `2px solid ${active ? '#1A0F0A' : '#F0EDE8'}`,
                }}>
                {sp.icon && <span>{sp.icon}</span>}
                <span>{sp.name_cs}</span>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? 'rgba(255,255,255,0.15)' : '#F7F5F1',
                    color: active ? 'white' : '#8B6550',
                  }}>
                  {sp.breeds.length}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Group filter (FCI for dogs, FIFe for cats) */}
      {useGroups && availableGroupsForFilter.length > 1 && (
        <div className="mb-6 pb-5 border-b border-[#F0EDE8]">
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#8B6550' }}>
            {registryName} skupina
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              label="Vše"
              active={selectedGroup === 'all'}
              onClick={() => setSelectedGroup('all')}
              count={current.breeds.length}
            />
            {availableGroupsForFilter.map(g => {
              const count = groupedBreeds.find(x => x.group === g)?.breeds.length ?? 0
              return (
                <FilterChip
                  key={g}
                  label={labels[g] ?? g}
                  active={selectedGroup === g}
                  onClick={() => setSelectedGroup(g)}
                  count={count}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Breed grid grouped by FCI */}
      {visibleGroups.length === 0 && (
        <p className="text-sm italic" style={{ color: '#A08070' }}>
          Pro tento druh zatím nejsou evidovány žádné rasy.
        </p>
      )}

      <div className="space-y-8">
        {visibleGroups.map(({ group, breeds }) => (
          <section key={group}>
            {useGroups && (
              <h3 className="font-display font-extrabold text-[#1A0F0A] text-base mb-3 flex items-center gap-2">
                <span
                  className="inline-block w-1 h-5 rounded-full"
                  style={{ background: '#E8634A' }}
                />
                {labels[group] ?? group}
                <span className="text-xs font-semibold" style={{ color: '#8B6550' }}>
                  ({breeds.length})
                </span>
              </h3>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {breeds.map(breed => (
                <Link
                  key={breed.slug}
                  href={`/katalog/${breed.slug}`}
                  className="group flex items-center justify-between gap-2 px-3.5 py-3 rounded-lg border border-[#F0EDE8] bg-white hover:border-[#E8634A] hover:shadow-sm transition-all no-underline">
                  <span className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#1A0F0A] group-hover:text-[#E8634A] transition-colors leading-snug block truncate">
                      {breed.name}
                    </span>
                    {breed.officialAbbreviation && (
                      <span className="text-[10px] font-bold tracking-wide" style={{ color: '#A08070' }}>
                        {breed.officialAbbreviation}
                      </span>
                    )}
                  </span>
                  {breed.count > 0 && (
                    <span
                      className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#FBF0EC', color: '#E8634A' }}>
                      {breed.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string
  active: boolean
  onClick: () => void
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
      style={{
        background: active ? '#E8634A' : 'white',
        color: active ? 'white' : '#6B4030',
        border: `1.5px solid ${active ? '#E8634A' : '#F0EDE8'}`,
      }}>
      <span>{label}</span>
      <span
        className="text-[10px] font-bold px-1 rounded-full"
        style={{
          background: active ? 'rgba(255,255,255,0.2)' : '#F7F5F1',
          color: active ? 'white' : '#8B6550',
          minWidth: '18px',
          textAlign: 'center',
        }}>
        {count}
      </span>
    </button>
  )
}
