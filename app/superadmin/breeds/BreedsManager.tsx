'use client'
import { useState } from 'react'
import type { BreedProfile } from '@/app/(public)/katalog/[slug]/page'

interface Species { id: string; name_cs: string; category: string }
interface Breed {
  id: string; species_id: string; name_cs: string; name_sk?: string
  origin_country?: string; size_category?: string; energy_level?: string
  hypoallergenic?: boolean; description?: string; is_custom?: boolean
  institution_id?: string; created_at: string; profile?: BreedProfile
  species?: { name_cs: string }[]
}

const SIZE_LABELS: Record<string, string> = { small: 'Malé', medium: 'Střední', large: 'Velké', xlarge: 'Obří' }
const ENERGY_LABELS: Record<string, string> = { low: 'Klidné', medium: 'Střední', high: 'Aktivní', very_high: 'Velmi aktivní' }

const inputCls = 'w-full px-3 py-2 rounded-md border-2 border-[#F0EDE8] bg-white text-sm text-[#2C1810] placeholder:text-[#A09890] focus:outline-none focus:border-[#E8634A] transition-colors'
const selectCls = inputCls + ' appearance-none'
const textareaCls = inputCls + ' resize-y'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550]">{label}</label>
      {children}
    </div>
  )
}

/** Editable list of strings (one per line textarea) */
function ListField({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <Field label={label}>
      <textarea
        className={textareaCls + ' min-h-[80px]'}
        value={value.join('\n')}
        onChange={e => onChange(e.target.value.split('\n'))}
        placeholder={placeholder ?? 'Jeden záznam na řádek...'}
        rows={3}
      />
      <span className="text-[10px] text-[#A09890]">Jeden záznam na řádek</span>
    </Field>
  )
}

const EMPTY_BREED = {
  species_id: '', name_cs: '', name_sk: '', origin_country: '',
  size_category: '', energy_level: '', hypoallergenic: false, description: '',
}

const EMPTY_PROFILE: BreedProfile = {
  name_en: '', height_cm: '', weight_kg: '', lifespan: '', fci_group: '',
  use_cases: [], character_intro: '', character_traits: [], character_warning: '',
  activity_needs: [], activity_suitable: [], activity_note: '',
  difficulty_rating: 0, difficulty_needs: [], warnings: [],
  history: '', history_facts: [], fun_facts: [], summary: '',
}

export function BreedsManager({ species, initialBreeds }: { species: Species[]; initialBreeds: Breed[] }) {
  const [breeds, setBreeds] = useState<Breed[]>(initialBreeds)
  const [filterSpecies, setFilterSpecies] = useState('')
  const [filterQ, setFilterQ] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_BREED })
  const [profile, setProfile] = useState<BreedProfile>({ ...EMPTY_PROFILE })
  const [profileOpen, setProfileOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

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
    setProfile({ ...EMPTY_PROFILE, ...(b.profile ?? {}) })
    setProfileOpen(false)
    setAdding(false)
  }

  function startAdd() {
    setAdding(true); setEditId(null)
    setForm({ ...EMPTY_BREED, species_id: filterSpecies })
    setProfile({ ...EMPTY_PROFILE })
    setProfileOpen(false)
  }

  function pf<K extends keyof BreedProfile>(key: K, value: BreedProfile[K]) {
    setProfile(p => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    if (!form.name_cs.trim() || !form.species_id) return
    setSaving(true)
    const payload = { ...form, profile: cleanProfile(profile) }
    try {
      if (adding) {
        const res = await fetch('/api/breeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setBreeds(prev => [{ ...data, ...payload, species: species.filter(s => s.id === form.species_id) }, ...prev])
        showToast(`Přidáno: ${form.name_cs}`)
      } else if (editId) {
        const res = await fetch(`/api/breeds/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        setBreeds(prev => prev.map(b => b.id === editId ? { ...b, ...payload } : b))
        showToast(`Uloženo: ${form.name_cs}`)
      }
      setAdding(false); setEditId(null)
    } catch (e) {
      showToast(`Chyba: ${e instanceof Error ? e.message : 'Neznámá'}`, false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Opravdu smazat plemeno „${name}"? Tuto akci nelze vrátit.`)) return
    const res = await fetch(`/api/breeds/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBreeds(prev => prev.filter(b => b.id !== id))
      showToast(`Smazáno: ${name}`)
    } else {
      showToast('Chyba při mazání', false)
    }
  }

  const isEditing = adding || editId !== null

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm font-bold shadow-lg ${toast.ok ? 'bg-[#2D7A4F]' : 'bg-[#D83030]'}`}>
          {toast.msg}
        </div>
      )}

      {/* Filters + add */}
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

      {/* Edit / Add form */}
      {isEditing && (
        <div className="bg-[#FDEAE6]/50 border-2 border-[#E8634A]/30 rounded-xl p-5 mb-5 space-y-4">
          <h3 className="font-bold text-[#2C1810]">{adding ? 'Přidat nové plemeno' : `Upravit: ${form.name_cs}`}</h3>

          {/* ── Basic fields ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Druh zvířete *">
              <select className={selectCls} value={form.species_id} onChange={e => setForm(p => ({ ...p, species_id: e.target.value }))}>
                <option value="">Vyberte druh...</option>
                {species.map(s => <option key={s.id} value={s.id}>{s.name_cs}</option>)}
              </select>
            </Field>
            <Field label="Název (CS) *">
              <input className={inputCls} value={form.name_cs} onChange={e => setForm(p => ({ ...p, name_cs: e.target.value }))} placeholder="Německý ovčák" />
            </Field>
            <Field label="Název (SK)">
              <input className={inputCls} value={form.name_sk} onChange={e => setForm(p => ({ ...p, name_sk: e.target.value }))} placeholder="Nemecký ovčiak" />
            </Field>
            <Field label="Země původu">
              <input className={inputCls} value={form.origin_country} onChange={e => setForm(p => ({ ...p, origin_country: e.target.value }))} placeholder="Německo" />
            </Field>
            <Field label="Kategorie velikosti">
              <select className={selectCls} value={form.size_category} onChange={e => setForm(p => ({ ...p, size_category: e.target.value }))}>
                <option value="">Vyberte...</option>
                <option value="small">Malé (do 10 kg)</option>
                <option value="medium">Střední (10–25 kg)</option>
                <option value="large">Velké (25–45 kg)</option>
                <option value="xlarge">Obří (45+ kg)</option>
              </select>
            </Field>
            <Field label="Energetická úroveň">
              <select className={selectCls} value={form.energy_level} onChange={e => setForm(p => ({ ...p, energy_level: e.target.value }))}>
                <option value="">Vyberte...</option>
                <option value="low">Klidné</option>
                <option value="medium">Střední</option>
                <option value="high">Aktivní</option>
                <option value="very_high">Velmi aktivní</option>
              </select>
            </Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Krátký popis">
                <textarea className={textareaCls + ' min-h-[60px]'} rows={2} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Stručný popis pro výpis..." />
              </Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.hypoallergenic} onChange={e => setForm(p => ({ ...p, hypoallergenic: e.target.checked }))}
                className="w-4 h-4 rounded border-2 border-[#F0EDE8] accent-[#E8634A]" />
              <span className="text-sm font-semibold text-[#2C1810]">Hypoalergenní</span>
            </label>
          </div>

          {/* ── Profile section toggle ── */}
          <div>
            <button type="button"
              onClick={() => setProfileOpen(o => !o)}
              className="flex items-center gap-2 text-sm font-bold text-[#E8634A] hover:text-[#d4553e] transition-colors">
              <span className={`transition-transform ${profileOpen ? 'rotate-90' : ''}`}>▶</span>
              Profil plemene (detailní popis pro web)
            </button>

            {profileOpen && (
              <div className="mt-4 pt-4 border-t border-[#E8634A]/20 space-y-5">
                <p className="text-xs text-[#8B6550]">Tato sekce se zobrazuje na veřejném profilu plemene. Každé pole je volitelné.</p>

                {/* Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Anglický název">
                    <input className={inputCls} value={profile.name_en ?? ''} onChange={e => pf('name_en', e.target.value)} placeholder="German Shepherd" />
                  </Field>
                  <Field label="Výška">
                    <input className={inputCls} value={profile.height_cm ?? ''} onChange={e => pf('height_cm', e.target.value)} placeholder="55–65 cm" />
                  </Field>
                  <Field label="Hmotnost">
                    <input className={inputCls} value={profile.weight_kg ?? ''} onChange={e => pf('weight_kg', e.target.value)} placeholder="22–40 kg" />
                  </Field>
                  <Field label="Délka života">
                    <input className={inputCls} value={profile.lifespan ?? ''} onChange={e => pf('lifespan', e.target.value)} placeholder="9–13 let" />
                  </Field>
                  <Field label="Skupina FCI">
                    <input className={inputCls} value={profile.fci_group ?? ''} onChange={e => pf('fci_group', e.target.value)} placeholder="ovčácká a pastevecká plemena" />
                  </Field>
                </div>

                <ListField label="Využití (jeden řádek = jeden štítek)" value={profile.use_cases ?? []} onChange={v => pf('use_cases', v)} placeholder="pracovní pes (policie, armáda)&#10;hlídač&#10;rodinný pes" />

                {/* Character */}
                <ProfileDivider title="🧠 Povaha" />
                <Field label="Úvodní odstavec povahy">
                  <textarea className={textareaCls + ' min-h-[80px]'} rows={3} value={profile.character_intro ?? ''}
                    onChange={e => pf('character_intro', e.target.value)}
                    placeholder="Německý ovčák je extrémně inteligentní, loajální..." />
                </Field>
                <ListField label="Vlastnosti charakteru (bullet points)" value={profile.character_traits ?? []} onChange={v => pf('character_traits', v)} placeholder="Silně se váže na svého majitele&#10;Má přirozený ochranitelský instinkt" />
                <Field label="Varování / poznámka k povaze">
                  <input className={inputCls} value={profile.character_warning ?? ''} onChange={e => pf('character_warning', e.target.value)} placeholder="Pokud ho nezaměstnáš, začne si práci hledat sám..." />
                </Field>

                {/* Activity */}
                <ProfileDivider title="⚡ Aktivita" />
                <ListField label="Potřeby aktivity (bullet points)" value={profile.activity_needs ?? []} onChange={v => pf('activity_needs', v)} placeholder="Vysoká potřeba pohybu (min. 1,5–2 hodiny denně)&#10;Miluje výcvik, práci, aport" />
                <ListField label="Vhodné aktivity (štítky)" value={profile.activity_suitable ?? []} onChange={v => pf('activity_suitable', v)} placeholder="poslušnost (obedience)&#10;agility&#10;služební výcvik" />
                <Field label="Poznámka k aktivitě">
                  <input className={inputCls} value={profile.activity_note ?? ''} onChange={e => pf('activity_note', e.target.value)} placeholder="Ideální pro aktivní lidi, ne pro gaučový režim." />
                </Field>

                {/* Difficulty */}
                <ProfileDivider title="🏡 Náročnost" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Náročnost chovu (1–5 hvězd)">
                    <select className={selectCls} value={profile.difficulty_rating ?? 0} onChange={e => pf('difficulty_rating', Number(e.target.value))}>
                      <option value={0}>Nevyplněno</option>
                      <option value={1}>⭐ Nízká</option>
                      <option value={2}>⭐⭐ Mírná</option>
                      <option value={3}>⭐⭐⭐ Střední</option>
                      <option value={4}>⭐⭐⭐⭐ Vyšší</option>
                      <option value={5}>⭐⭐⭐⭐⭐ Vysoká</option>
                    </select>
                  </Field>
                </div>
                <ListField label="Co plemeno potřebuje" value={profile.difficulty_needs ?? []} onChange={v => pf('difficulty_needs', v)} placeholder="důslednou výchovu od štěněte&#10;socializaci&#10;mentální stimulaci" />
                <ListField label="⚠️ Časté problémy / zdravotní rizika" value={profile.warnings ?? []} onChange={v => pf('warnings', v)} placeholder="separační úzkost (silná vazba na pána)&#10;dysplazie kyčlí" />

                {/* History */}
                <ProfileDivider title="📜 Historie" />
                <Field label="Odstavec historie">
                  <textarea className={textareaCls + ' min-h-[80px]'} rows={3} value={profile.history ?? ''}
                    onChange={e => pf('history', e.target.value)}
                    placeholder="Plemeno vzniklo koncem 19. století v Německu..." />
                </Field>
                <ListField label="Klíčové historické fakty (→ fakty)" value={profile.history_facts ?? []} onChange={v => pf('history_facts', v)} placeholder="První oficiální jedinec: pes jménem Horand von Grafrath&#10;Původně sloužil jako pastevecký pes" />

                {/* Fun facts + summary */}
                <ProfileDivider title="🧩 Zajímavosti a shrnutí" />
                <ListField label="Zajímavosti (max. 3, jeden řádek = jedna karta)" value={profile.fun_facts ?? []} onChange={v => pf('fun_facts', v)} placeholder="Patří mezi nejčastěji používané psy u policie po celém světě&#10;Považován za jedno z nejchytřejších plemen (TOP 3)" />
                <Field label="Závěrečné shrnutí">
                  <textarea className={textareaCls + ' min-h-[80px]'} rows={3} value={profile.summary ?? ''}
                    onChange={e => pf('summary', e.target.value)}
                    placeholder="Německý ovčák je extrémně schopný a věrný pes, ale není to easy plemeno..." />
                </Field>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
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
        <div className="px-4 py-3 border-b border-[#F0EDE8]">
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
                    {b.profile?.name_en && <span className="text-xs text-[#A09890]">({b.profile.name_en})</span>}
                    {b.is_custom && <span className="px-1.5 py-px text-[10px] font-bold bg-[#FFF3D6] text-[#7a5800] rounded">vlastní</span>}
                    {b.profile && Object.keys(b.profile).some(k => !!(b.profile as Record<string,unknown>)[k]) && (
                      <span className="px-1.5 py-px text-[10px] font-bold bg-[#EBF7F0] text-[#2D7A4F] rounded">✓ profil</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    <span className="text-xs text-[#8B6550]">{b.species?.[0]?.name_cs ?? '—'}</span>
                    {b.size_category && <span className="text-xs text-[#A09890]">· {SIZE_LABELS[b.size_category]}</span>}
                    {b.energy_level && <span className="text-xs text-[#A09890]">· {ENERGY_LABELS[b.energy_level]}</span>}
                    {b.hypoallergenic && <span className="text-xs text-[#2D8A4E]">· Hypoalergenní</span>}
                    {b.origin_country && <span className="text-xs text-[#A09890]">· {b.origin_country}</span>}
                  </div>
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

function ProfileDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-bold text-sm text-[#2C1810]">{title}</span>
      <div className="flex-1 h-px bg-[#F0EDE8]" />
    </div>
  )
}

function cleanProfile(p: BreedProfile): BreedProfile {
  const clean = { ...p }
  // Remove empty strings, convert "line split" arrays back – remove empty lines
  if (clean.use_cases) clean.use_cases = clean.use_cases.filter(Boolean)
  if (clean.character_traits) clean.character_traits = clean.character_traits.filter(Boolean)
  if (clean.activity_needs) clean.activity_needs = clean.activity_needs.filter(Boolean)
  if (clean.activity_suitable) clean.activity_suitable = clean.activity_suitable.filter(Boolean)
  if (clean.difficulty_needs) clean.difficulty_needs = clean.difficulty_needs.filter(Boolean)
  if (clean.warnings) clean.warnings = clean.warnings.filter(Boolean)
  if (clean.history_facts) clean.history_facts = clean.history_facts.filter(Boolean)
  if (clean.fun_facts) clean.fun_facts = clean.fun_facts.filter(Boolean)
  if (!clean.difficulty_rating) clean.difficulty_rating = undefined
  return clean
}
