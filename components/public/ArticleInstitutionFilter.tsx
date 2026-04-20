'use client'

interface Props {
  institutions: { id: string; name: string }[]
  current?: string
  kategorie?: string
}

export function ArticleInstitutionFilter({ institutions, current, kategorie }: Props) {
  if (institutions.length === 0) return null

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = new URL(window.location.href)
    if (e.target.value) url.searchParams.set('instituce', e.target.value)
    else url.searchParams.delete('instituce')
    if (kategorie) url.searchParams.set('kategorie', kategorie)
    else url.searchParams.delete('kategorie')
    window.location.href = url.toString()
  }

  return (
    <select
      defaultValue={current ?? ''}
      onChange={handleChange}
      className="text-xs font-semibold border border-border rounded-pill px-3 py-1.5 bg-white text-text-muted outline-none cursor-pointer focus:border-espresso transition-colors"
    >
      <option value="">🏠 Všechny instituce</option>
      {institutions.map(inst => (
        <option key={inst.id} value={inst.id}>{inst.name}</option>
      ))}
    </select>
  )
}
