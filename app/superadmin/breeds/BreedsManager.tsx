'use client'
import { useState } from 'react'

interface Species { id: string; name_cs: string; category: string }
interface Breed {
  id: string; species_id: string; name_cs: string; name_sk?: string
  origin_country?: string; size_category?: string; energy_level?: string
  hypoallergenic?: boolean; description?: string; is_custom?: boolean
  institution_id?: string; created_at: string
  species?: { name_cs: string }
}

const SIZE_LABELS: Record<string, string> = { small: 'Malé', medium: 'Střední', large: 'Velké', xlarge: 'Obří' }
const ENERGY_LABELS: Record<string, string> = { low: 'Klidné', medium: 'Střední', high: 'Aktivní', very_high: 'Velmi aktivní' }

const inputCls = 'w-full px-3 py-2 rounded-md border-2 border-[#F0EDE8] bg-white text-sm text-[#2C1810] placeholder:text-[#A09890] focus:outline-none focus:border-[#E8634A] transition-colors'
const selectCls = inputCls + ' appearance-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550]">{label}</label>
      {children}
    </div>
  )
}

const EMPTY_BREED = { species_id: '', name_cs: '', name_sk: '', origin_country: '', size_category: '', energy_level: '', hypoallergenic: false, description: '' }

export function BreedsManager({ species, initialBreeds }: { species: Species[]; initialBreeds: Breed[] }) {
  const [breeds, setBreeds] = useState<Breed[]>(initialBreeds)
  const [filterSpecies, setFilterSpecies] = useState('')
  const [filterQ, setFilterQ] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_BREED })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filtered = breeds.filter(b => {
    if (filterSpecies && b.species_id !== filterSpecies) return false
    if (filterQ && !b.name_cs.toLowerCase().includes(filterQ.toLowerCase())) return false
    return true
  })

  function startEdit(b: Breed) {
    setEditId(b.id)
    setForm({
      species_id: b.species_id, name_cs: b.name_cs, name_sk: b.name_sk ?? '',
      origin_country: b.origin_country ?? '', size_category: b.size_category ?? '',
      energy_level: b.energy_level ?? '', hypoallergenic: b.hypoallergenic ?? false,
      description: b.description ?? '',
    })
    setAdding(false)
  }

  function startAdd() {
    setAdding(true); setEditId(null)
    setForm({ ...EMPTY_BREED, species_id: filterSpecies })
  }

  async function handleSave() {
    if (!form.name_cs.trim() || !form.species_id) return
    setSaving(true)
    try {
      if (adding) {
        const res = await fetch('/api/breeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setBreeds(prev => [{ ...data, ...form, species: species.find(s => s.id === form.species_id) }, ...prev])
        showToast(`Přidáno: ${form.name_cs}`)
      } else if (editId) {
        const res = await fetch(`/api/breeds/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        setBreeds(prev => prev.map(b => b.id === editId ? { ...b, ...form } : b))
        showToast(`Uloženo: ${form.name_cs}`)
      }
      setAdding(false); setEditId(null)
    } catch (e) {
      showToast(`Chyba: ${e instanceof Error ? e.message : 'Neznámá'}`)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Opravdu smazat plemeno „${name}"? Tuto akci nelze vrátit.`)) return
    const res = await fetch(`/api/breeds/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBreeds(prev => prev.filter(b => b.id !== id))
      showToast(`Smazáno: ${name}`)
    } else {
      showToast('Chyba při mazání')
    }
  }

  const isEditing = adding || editId !== null

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-[#2D7A4F] text-white text-sm font-bold shadow-lg">{toast}</div>
      )}

      {/* Filters + add button */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select className={selectCls + ' flex-1 min-w-[160px]'} value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)}>
          <option value="">Všechny druhy</option>
          {species.map(s => <option key={s.id} value={s.id}>{s.name_cs}</option>)}
        </select>
        <input className={inputCls + ' flex-1 min-w-[160px]'} placeholder="Hledat plemeno..." value={filterQ} onChange={e => setFilterQ(e.target.value)} />
        <button type="button" onClick={startAdd}
          className="px-4 py-2 rounded-lg bg-[#E8634A] text-white font-bold text-sm hover:bg-[#d4553e] transition-colors whitespace-nowrap">
          + Přidat plemeno
        </button>
      </div>

      {/* Add / Edit form */}
      {isEditing && (
        <div className="bg-[#FDEAE6]/50 border-2 border-[#E8634A]/30 rounded-xl p-5 mb-5">
          <h3 className="font-bold text-[#2C1810] mb-4">{adding ? 'Přidat nové plemeno' : `Upravit: ${form.name_cs}`}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Field label="Druh zvířete *">
              <select className={selectCls} value={form.species_id} onChange={e => setForm(p => ({...p, species_id: e.target.value}))}>
                <option value="">Vyberte druh...</option>
                {species.map(s => <option key={s.id} value={s.id}>{s.name_cs}</option>)}
              </select>
            </Field>
            <Field label="Název (CS) *">
              <input className={inputCls} value={form.name_cs} onChange={e => setForm(p => ({...p, name_cs: e.target.value}))} placeholder="Německý ovčák" />
            </Field>
            <Field label="Název (SK)">
              <input className={inputCls} value={form.name_sk} onChange={e => setForm(p => ({...p, name_sk: e.target.value}))} placeholder="Nemecký ovčiak" />
            </Field>
            <Field label="Země původu">
              <input className={inputCls} value={form.origin_country} onChange={e => setForm(p => ({...p, origin_country: e.target.value}))} placeholder="Německo" />
            </Field>
            <Field label="Kategorie velikosti">
              <select className={selectCls} value={form.size_category} onChange={e => setForm(p => ({...p, size_category: e.target.value}))}>
                <option value="">Vyberte...</option>
                <option value="small">Malé (do 10 kg)</option>
                <option value="medium">Střední (10–25 kg)</option>
                <option value="large">Velké (25–45 kg)</option>
                <option value="xlarge">Obří (45+ kg)</option>
              </select>
            </Field>
            <Field label="Energetická úroveň">
              <select className={selectCls} value={form.energy_level} onChange={e => setForm(p => ({...p, energy_level: e.target.value}))}>
                <option value="">Vyberte...</option>
                <option value="low">Klidné</option>
                <option value="medium">Střední</option>
                <option value="high">Aktivní</option>
                <option value="very_high">Velmi aktivní</option>
              </select>
            </Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Popis (pro budoucí využití na webu)">
                <textarea className={inputCls + ' resize-y min-h-[72px]'} rows={3} value={form.description}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  placeholder="Stručný popis charakteristiky plemene..." />
              </Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.hypoallergenic} onChange={e => setForm(p => ({...p, hypoallergenic: e.target.checked}))}
                className="w-4 h-4 rounded border-2 border-[#F0EDE8] accent-[#E8634A]" />
              <span className="text-sm font-semibold text-[#2C1810]">Hypoalergenní</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving || !form.name_cs.trim() || !form.species_id}
              className="px-5 py-2.5 rounded-lg bg-[#E8634A] text-white font-bold text-sm disabled:opacity-50 hover:bg-[#d4553e] transition-colors">
              {saving ? 'Ukládám...' : adding ? 'Přidat' : 'Uložit'}
            </button>
            <button type="button" onClick={() => { setAdding(false); setEditId(null) }}
              className="px-5 py-2.5 rounded-lg border-2 border-[#F0EDE8] text-[#8B6550] font-bold text-sm hover:bg-[#F0EDE8] transition-colors">
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* Breeds table */}
      <div className="bg-white rounded-xl border border-[#F0EDE8] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F0EDE8] flex items-center justify-between">
          <span className="text-sm font-bold text-[#2C1810]">{filtered.length} plemen</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#A09890]">
            <div className="text-3xl mb-2">🐾</div>
            <p className="text-sm">Žádná plemena</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0EDE8]">
            {filtered.map(b => (
              <div key={b.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-[#FDFCFA] transition-colors ${editId === b.id ? 'bg-[#FDEAE6]/30' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-[#2C1810]">{b.name_cs}</span>
                    {b.name_sk && <span className="text-xs text-[#A09890]">/ {b.name_sk}</span>}
                    {b.is_custom && <span className="px-1.5 py-px text-[10px] font-bold bg-[#FFF3D6] text-[#7a5800] rounded">vlastní</span>}
                    {b.institution_id && <span className="px-1.5 py-px text-[10px] font-bold bg-[#E6F1FB] text-[#185FA5] rounded">instituce</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-[#8B6550]">{b.species?.name_cs ?? '—'}</span>
                    {b.size_category && <span className="text-xs text-[#A09890]">· {SIZE_LABELS[b.size_category]}</span>}
                    {b.energy_level && <span className="text-xs text-[#A09890]">· {ENERGY_LABELS[b.energy_level]}</span>}
                    {b.hypoallergenic && <span className="text-xs text-[#2D8A4E]">· Hypoalergenní</span>}
                    {b.origin_country && <span className="text-xs text-[#A09890]">· {b.origin_country}</span>}
                  </div>
                  {b.description && <p className="text-xs text-[#8B6550] mt-0.5 line-clamp-1">{b.description}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button type="button" onClick={() => startEdit(b)}
                    className="px-3 py-1.5 rounded-md border-2 border-[#F0EDE8] text-xs font-bold text-[#6B4030] hover:border-[#E8634A] hover:text-[#E8634A] transition-colors">
                    Upravit
                  </button>
                  <button type="button" onClick={() => handleDelete(b.id, b.name_cs)}
                    className="px-3 py-1.5 rounded-md border-2 border-[#F0EDE8] text-xs font-bold text-[#A09890] hover:border-[#D83030] hover:text-[#D83030] transition-colors">
                    Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
