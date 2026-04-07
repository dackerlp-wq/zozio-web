'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface FundraiserFormProps {
  institutionId: string
  institutionType: string
  animals: { id: string; name: string }[]
  rescueCases: { id: string; name: string | null; case_number: string | null }[]
  mode: 'create' | 'edit'
  fundraiser?: any
}

export function FundraiserForm({
  institutionId, institutionType, animals, rescueCases, mode, fundraiser
}: FundraiserFormProps) {
  const router = useRouter()
  const isShelter = institutionType === 'shelter'

  const [form, setForm] = useState({
    title:          fundraiser?.title          ?? '',
    description:    fundraiser?.description    ?? '',
    goal_amount:    fundraiser?.goal_amount    ?? '',
    current_amount: fundraiser?.current_amount ?? 0,
    deadline:       fundraiser?.deadline       ? fundraiser.deadline.slice(0, 10) : '',
    active:         fundraiser?.active         ?? true,
    animal_id:      fundraiser?.animal_id      ?? '',
    rescue_case_id: fundraiser?.rescue_case_id ?? '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const update = (key: string, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.title || !form.goal_amount) {
      setError('Vyplň název a cíl sbírky')
      return
    }
    setLoading(true)
    setError(null)

    const payload = {
      institution_id:  institutionId,
      title:           form.title,
      description:     form.description || null,
      goal_amount:     parseInt(form.goal_amount),
      current_amount:  parseInt(form.current_amount) || 0,
      deadline:        form.deadline || null,
      active:          form.active,
      animal_id:       form.animal_id      || null,
      rescue_case_id:  form.rescue_case_id || null,
    }

    const url  = mode === 'create' ? '/api/fundraisers' : `/api/fundraisers/${fundraiser.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Chyba při ukládání'); setLoading(false); return }

    router.push('/admin/fundraisers')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Opravdu smazat tuto sbírku?')) return
    await fetch(`/api/fundraisers/${fundraiser.id}`, { method: 'DELETE' })
    router.push('/admin/fundraisers')
    router.refresh()
  }

  const inputCls = 'px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors w-full bg-white'

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">

      {/* Levý panel */}
      <div className="lg:col-span-2 space-y-5">

        {/* Základní info */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-4">
            Základní informace
          </h2>
          <div className="space-y-4">
            <Field label="Název sbírky *">
              <input
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="Pomoz Maxovi s operací"
                className={inputCls}
              />
            </Field>
            <Field label="Popis sbírky">
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Max potřebuje operaci kyčle před adopcí. Přispěj na jeho léčbu!"
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>
        </div>

        {/* Finanční cíl */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-4">
            Finanční cíl
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Cílová částka (Kč) *">
                <input
                  type="number"
                  value={form.goal_amount}
                  onChange={e => update('goal_amount', e.target.value)}
                  placeholder="8000"
                  className={inputCls}
                />
              </Field>
              <Field label="Aktuálně vybráno (Kč)">
                <input
                  type="number"
                  value={form.current_amount}
                  onChange={e => update('current_amount', e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Termín sbírky (volitelné)">
              <input
                type="date"
                value={form.deadline}
                onChange={e => update('deadline', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Propojení se zvířetem */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-1">
            Propojit se zvířetem
          </h2>
          <p className="text-xs text-gray mb-4">Volitelné — sbírka bude zobrazena na profilu zvířete.</p>

          {isShelter ? (
            <Field label="Zvíře (volitelné)">
              <select
                value={form.animal_id}
                onChange={e => update('animal_id', e.target.value)}
                className={inputCls}
              >
                <option value="">Žádné — obecná sbírka</option>
                {animals.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Záchranný případ (volitelné)">
              <select
                value={form.rescue_case_id}
                onChange={e => update('rescue_case_id', e.target.value)}
                className={inputCls}
              >
                <option value="">Žádný — obecná sbírka</option>
                {rescueCases.map(c => (
                  <option key={c.id} value={c.id}>{c.name ?? c.case_number}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </div>

      {/* Pravý panel */}
      <div className="space-y-5">

        {/* Stav */}
        <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
          <h3 className="font-display font-extrabold text-lg text-espresso mb-4">Stav</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => update('active', e.target.checked)}
              className="w-4 h-4 accent-coral"
            />
            <span className="font-body text-sm font-semibold text-espresso">Aktivní sbírka</span>
          </label>
          <p className="text-xs text-gray mt-2">
            Neaktivní sbírky se nezobrazují na veřejném webu.
          </p>
        </div>

        {/* Progress náhled */}
        {form.goal_amount && (
          <div className="bg-amber-light rounded-lg p-5">
            <h3 className="font-display font-bold text-sm text-espresso mb-3">Náhled progress baru</h3>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-bold">{Number(form.current_amount).toLocaleString('cs-CZ')} Kč</span>
              <span className="text-gray text-xs">z {Number(form.goal_amount).toLocaleString('cs-CZ')} Kč</span>
            </div>
            <div className="w-full h-3 bg-white rounded-pill overflow-hidden">
              <div
                className="h-full bg-coral rounded-pill transition-all"
                style={{ width: `${Math.min(Math.round((Number(form.current_amount) / Number(form.goal_amount)) * 100), 100)}%` }}
              />
            </div>
            <div className="text-xs text-coral font-bold mt-1">
              {Math.min(Math.round((Number(form.current_amount) / Number(form.goal_amount)) * 100), 100)}% vybráno
            </div>
          </div>
        )}

        {/* Chyba + uložit */}
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
          {mode === 'create' ? '✓ Vytvořit sbírku' : '✓ Uložit změny'}
        </Button>

        {mode === 'edit' && (
          <button
            onClick={handleDelete}
            className="w-full py-2.5 text-sm text-gray hover:text-coral transition-colors font-semibold cursor-pointer bg-transparent border-none"
          >
            🗑 Smazat sbírku
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
