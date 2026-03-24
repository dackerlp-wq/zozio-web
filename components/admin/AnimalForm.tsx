'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface AnimalFormProps {
  institutionId: string
  institutionType: string
  species: { id: string; name_cs: string; icon: string | null }[]
  mode: 'create' | 'edit'
  animal?: any
}

export function AnimalForm({ institutionId, institutionType, species, mode, animal }: AnimalFormProps) {
  const router = useRouter()
  const isShelter = institutionType === 'shelter'
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name:           animal?.name           ?? '',
    species_id:     animal?.species_id     ?? '',
    sex:            animal?.sex            ?? '',
    birth_year:     animal?.birth_year     ?? '',
    size:           animal?.size           ?? '',
    breed:          animal?.breed          ?? '',
    color:          animal?.color          ?? '',
    weight_kg:      animal?.weight_kg      ?? '',
    description:    animal?.description    ?? '',
    adoption_status: animal?.adoption_status ?? 'available',
    urgent:         animal?.urgent         ?? false,
    adoption_fee:   animal?.adoption_fee   ?? 0,
    vaccinated:     animal?.vaccinated     ?? false,
    neutered:       animal?.neutered       ?? false,
    microchipped:   animal?.microchipped   ?? false,
    good_with_kids: animal?.good_with_kids ?? false,
    good_with_dogs: animal?.good_with_dogs ?? false,
    good_with_cats: animal?.good_with_cats ?? false,
    special_needs:  animal?.special_needs  ?? '',
    published:      animal?.published      ?? true,
    // Rescue fields
    case_number:      animal?.case_number      ?? '',
    estimated_age:    animal?.estimated_age    ?? '',
    status:           animal?.status           ?? 'intake',
    cause_of_injury:  animal?.cause_of_injury  ?? '',
    diagnosis:        animal?.diagnosis        ?? '',
    treatment_notes:  animal?.treatment_notes  ?? '',
    public_description: animal?.public_description ?? '',
    found_location:   animal?.found_location   ?? '',
    found_by:         animal?.found_by         ?? '',
  })

  const [photos, setPhotos] = useState<string[]>(animal?.photos ?? [])
  const [primaryPhoto, setPrimaryPhoto] = useState<string>(animal?.primary_photo ?? '')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: string, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  // Upload fotky
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    const supabase = createClient()
    const newPhotos: string[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `animals/${institutionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('animal-photos')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('animal-photos')
        .getPublicUrl(path)

      newPhotos.push(publicUrl)
    }

    const updated = [...photos, ...newPhotos]
    setPhotos(updated)
    if (!primaryPhoto && updated.length > 0) setPrimaryPhoto(updated[0])
    setUploading(false)
  }

  const removePhoto = (url: string) => {
    const updated = photos.filter(p => p !== url)
    setPhotos(updated)
    if (primaryPhoto === url) setPrimaryPhoto(updated[0] ?? '')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const table = isShelter ? 'animals' : 'rescue_cases'
    const url = mode === 'create'
      ? `/api/${table}`
      : `/api/${table}/${animal.id}`

    const payload = isShelter ? {
      institution_id: institutionId,
      name:           form.name,
      species_id:     form.species_id || null,
      sex:            form.sex || null,
      birth_year:     form.birth_year ? parseInt(form.birth_year) : null,
      size:           form.size || null,
      breed:          form.breed || null,
      color:          form.color || null,
      weight_kg:      form.weight_kg ? parseFloat(form.weight_kg) : null,
      description:    form.description || null,
      adoption_status: form.adoption_status,
      urgent:         form.urgent,
      adoption_fee:   parseInt(form.adoption_fee) || 0,
      vaccinated:     form.vaccinated,
      neutered:       form.neutered,
      microchipped:   form.microchipped,
      good_with_kids: form.good_with_kids,
      good_with_dogs: form.good_with_dogs,
      good_with_cats: form.good_with_cats,
      special_needs:  form.special_needs || null,
      photos,
      primary_photo:  primaryPhoto || null,
      published:      form.published,
    } : {
      institution_id:     institutionId,
      name:               form.name || null,
      species_id:         form.species_id || null,
      sex:                form.sex || null,
      estimated_age:      form.estimated_age || null,
      status:             form.status,
      cause_of_injury:    form.cause_of_injury || null,
      diagnosis:          form.diagnosis || null,
      treatment_notes:    form.treatment_notes || null,
      public_description: form.public_description || null,
      found_location:     form.found_location || null,
      found_by:           form.found_by || null,
      photos,
      primary_photo:      primaryPhoto || null,
      published:          form.published,
    }

    const res = await fetch(url, {
      method: mode === 'create' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Chyba při ukládání')
      setLoading(false)
      return
    }

    router.push('/admin/animals')
    router.refresh()
  }

  const inputCls = 'px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors w-full bg-white'
  const checkCls = 'w-4 h-4 accent-coral cursor-pointer'

  return (
    <div className="grid grid-cols-3 gap-6">

      {/* Levý panel — hlavní info */}
      <div className="col-span-2 space-y-5">

        {/* Základní info */}
        <div className="bg-white rounded-lg p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-xl text-espresso mb-4">
            Základní informace
          </h2>
          <div className="space-y-4">

            {isShelter ? (
              <Field label="Jméno zvířete *">
                <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Max" className={inputCls} />
              </Field>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Jméno (volitelné)">
                  <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Vocálko" className={inputCls} />
                </Field>
                <Field label="Číslo případu">
                  <input value={form.case_number} onChange={e => update('case_number', e.target.value)} placeholder="ZS-2026-001" className={inputCls} />
                </Field>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Druh">
                <select value={form.species_id} onChange={e => update('species_id', e.target.value)} className={inputCls}>
                  <option value="">Vybrat druh...</option>
                  {species.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name_cs}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pohlaví">
                <select value={form.sex} onChange={e => update('sex', e.target.value)} className={inputCls}>
                  <option value="">Neznámé</option>
                  <option value="male">♂ Samec</option>
                  <option value="female">♀ Samice</option>
                </select>
              </Field>
            </div>

            {isShelter ? (
              <div className="grid grid-cols-3 gap-4">
                <Field label="Rok narození">
                  <input type="number" value={form.birth_year} onChange={e => update('birth_year', e.target.value)} placeholder="2021" className={inputCls} />
                </Field>
                <Field label="Velikost">
                  <select value={form.size} onChange={e => update('size', e.target.value)} className={inputCls}>
                    <option value="">Vybrat...</option>
                    <option value="small">Malý</option>
                    <option value="medium">Střední</option>
                    <option value="large">Velký</option>
                    <option value="xlarge">Extra velký</option>
                  </select>
                </Field>
                <Field label="Váha (kg)">
                  <input type="number" step="0.1" value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)} placeholder="15.5" className={inputCls} />
                </Field>
              </div>
            ) : (
              <Field label="Odhadovaný věk">
                <input value={form.estimated_age} onChange={e => update('estimated_age', e.target.value)} placeholder="Dospělý, Mládě, 2 roky..." className={inputCls} />
              </Field>
            )}

            {isShelter && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Plemeno / rasa">
                  <input value={form.breed} onChange={e => update('breed', e.target.value)} placeholder="Labrador kříženec" className={inputCls} />
                </Field>
                <Field label="Barva">
                  <input value={form.color} onChange={e => update('color', e.target.value)} placeholder="Zlatohnědý" className={inputCls} />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* Popis */}
        <div className="bg-white rounded-lg p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-xl text-espresso mb-4">Popis</h2>
          <Field label={isShelter ? 'Popis pro adoptivní rodiny' : 'Veřejný popis (pro sbírky)'}>
            <textarea
              value={isShelter ? form.description : form.public_description}
              onChange={e => update(isShelter ? 'description' : 'public_description', e.target.value)}
              placeholder={isShelter
                ? 'Max je energický a přátelský pes...'
                : 'Vocálko byl nalezen na dálnici...'
              }
              rows={5}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {!isShelter && (
            <div className="mt-4 space-y-4">
              <Field label="Příčina zranění / nemoci">
                <input value={form.cause_of_injury} onChange={e => update('cause_of_injury', e.target.value)} placeholder="Střet s vozidlem" className={inputCls} />
              </Field>
              <Field label="Diagnóza">
                <input value={form.diagnosis} onChange={e => update('diagnosis', e.target.value)} placeholder="Zlomené pravé křídlo" className={inputCls} />
              </Field>
              <Field label="Průběh léčby">
                <textarea value={form.treatment_notes} onChange={e => update('treatment_notes', e.target.value)} placeholder="Operace proběhla úspěšně..." rows={3} className={`${inputCls} resize-none`} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Místo nálezu">
                  <input value={form.found_location} onChange={e => update('found_location', e.target.value)} placeholder="Dálnice D1 u Jihlavy" className={inputCls} />
                </Field>
                <Field label="Nalezl/a">
                  <input value={form.found_by} onChange={e => update('found_by', e.target.value)} placeholder="Řidič kamiónu" className={inputCls} />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* Zdraví — pouze útulky */}
        {isShelter && (
          <div className="bg-white rounded-lg p-6 border border-gray-pale shadow-sm">
            <h2 className="font-display font-extrabold text-xl text-espresso mb-4">Zdraví & povaha</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { key: 'vaccinated',     label: '💉 Očkovaný' },
                { key: 'neutered',       label: '✂️ Kastrovaný / sterilizovaná' },
                { key: 'microchipped',   label: '📡 Čipovaný' },
                { key: 'good_with_kids', label: '🧒 Vychází s dětmi' },
                { key: 'good_with_dogs', label: '🐕 Vychází se psy' },
                { key: 'good_with_cats', label: '🐈 Vychází s kočkami' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as any)[key]}
                    onChange={e => update(key, e.target.checked)}
                    className={checkCls}
                  />
                  <span className="font-body text-sm font-semibold text-espresso">{label}</span>
                </label>
              ))}
            </div>
            <Field label="Speciální potřeby">
              <input value={form.special_needs} onChange={e => update('special_needs', e.target.value)} placeholder="Dieta, léky, alergies..." className={inputCls} />
            </Field>
          </div>
        )}
      </div>

      {/* Pravý panel */}
      <div className="space-y-5">

        {/* Stav */}
        <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
          <h3 className="font-display font-extrabold text-lg text-espresso mb-4">Stav</h3>

          {isShelter ? (
            <div className="space-y-3">
              <Field label="Stav adopce">
                <select value={form.adoption_status} onChange={e => update('adoption_status', e.target.value)} className={inputCls}>
                  <option value="available">✓ K adopci</option>
                  <option value="reserved">⏳ Rezervováno</option>
                  <option value="adopted">🏠 Adoptováno</option>
                  <option value="foster">👨‍👩‍👧 Foster</option>
                  <option value="not_for_adoption">⛔ Není k adopci</option>
                </select>
              </Field>
              <Field label="Adopční poplatek (Kč)">
                <input type="number" value={form.adoption_fee} onChange={e => update('adoption_fee', e.target.value)} placeholder="0" className={inputCls} />
              </Field>
              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <input type="checkbox" checked={form.urgent} onChange={e => update('urgent', e.target.checked)} className={checkCls} />
                <span className="font-body text-sm font-bold text-coral">🆘 Urgentní adopce</span>
              </label>
            </div>
          ) : (
            <Field label="Stav léčby">
              <select value={form.status} onChange={e => update('status', e.target.value)} className={inputCls}>
                <option value="intake">🚑 Příjem</option>
                <option value="treatment">🩺 Léčba</option>
                <option value="rehabilitation">💪 Rehabilitace</option>
                <option value="released">✓ Propuštěn do přírody</option>
                <option value="transferred">🚐 Přemístěn</option>
                <option value="deceased">💔 Uhynul</option>
              </select>
            </Field>
          )}

          <label className="flex items-center gap-3 cursor-pointer mt-4">
            <input type="checkbox" checked={form.published} onChange={e => update('published', e.target.checked)} className={checkCls} />
            <span className="font-body text-sm font-semibold text-espresso">Zveřejněno na webu</span>
          </label>
        </div>

        {/* Fotky */}
        <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
          <h3 className="font-display font-extrabold text-lg text-espresso mb-3">Fotografie</h3>

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {photos.map((url, i) => (
                <div key={i} className="relative group">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden border-2 border-transparent hover:border-coral transition-all cursor-pointer"
                    onClick={() => setPrimaryPhoto(url)}
                    style={{ borderColor: primaryPhoto === url ? 'var(--coral)' : undefined }}>
                    <Image src={url} alt={`foto ${i+1}`} fill className="object-cover" />
                    {primaryPhoto === url && (
                      <div className="absolute inset-0 bg-coral/20 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓ Hlavní</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removePhoto(url)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-coral text-white rounded-full text-xs font-bold hidden group-hover:flex items-center justify-center cursor-pointer border-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <Button
            variant="sand"
            size="sm"
            className="w-full justify-center"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? 'Nahrávám...' : '📷 Přidat fotky'}
          </Button>
          {photos.length > 0 && (
            <p className="text-xs text-gray mt-2 text-center">Klikni na fotku pro nastavení jako hlavní</p>
          )}
        </div>

        {/* Uložit */}
        {error && (
          <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm">
            ⚠️ {error}
          </div>
        )}

        <Button
          variant="primary"
          className="w-full justify-center"
          loading={loading}
          onClick={handleSubmit}
        >
          {mode === 'create' ? '✓ Přidat zvíře' : '✓ Uložit změny'}
        </Button>

        {mode === 'edit' && (
          <button
            onClick={async () => {
              if (!confirm('Opravdu smazat?')) return
              const table = isShelter ? 'animals' : 'rescue_cases'
              await fetch(`/api/${table}/${animal.id}`, { method: 'DELETE' })
              router.push('/admin/animals')
              router.refresh()
            }}
            className="w-full py-2.5 text-sm text-gray hover:text-coral transition-colors font-semibold cursor-pointer bg-transparent border-none"
          >
            🗑 Smazat záznam
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-brown uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
