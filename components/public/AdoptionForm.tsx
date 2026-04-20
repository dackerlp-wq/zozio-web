'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface AdoptionFormProps {
  animalId: string
  animalName: string
  institutionId: string
  initialName?: string
  initialEmail?: string
}

const inputCls = 'px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors'

export function AdoptionForm({ animalId, animalName, institutionId, initialName = '', initialEmail = '' }: AdoptionFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    applicant_name:      initialName,
    applicant_email:     initialEmail,
    applicant_phone:     '',
    applicant_city:      '',
    housing_type:        '',
    has_garden:          '',
    other_pets:          '',
    has_children:        '',
    children_ages:       '',
    backup_caregiver:    '',
    purpose:             '',
    hours_alone_weekday: '',
    hours_alone_weekend: '',
    experience:          '',
    motivation:          '',
    application_message: '',
  })

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animal_id:       animalId,
          institution_id:  institutionId,
          ...form,
          has_garden:          form.has_garden === 'true',
          has_children:        form.has_children === 'true',
          hours_alone_weekday: form.hours_alone_weekday === '' ? null : Number(form.hours_alone_weekday),
          hours_alone_weekend: form.hours_alone_weekend === '' ? null : Number(form.hours_alone_weekend),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Chyba při odesílání')
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="font-display font-extrabold text-xl text-espresso mb-2">
          Žádost odeslána!
        </h3>
        <p className="text-sm text-gray mb-4">
          Útulek tě brzy kontaktuje na <strong>{form.applicant_email}</strong>.
        </p>
        <Link
          href="/profil"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[100px] text-sm font-bold text-white no-underline"
          style={{ background: '#E8634A' }}
        >
          📋 Sledovat stav žádosti
        </Link>
      </div>
    )
  }

  const totalSteps = 4

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-pill transition-all ${s <= step ? 'bg-coral' : 'bg-gray-pale'}`} />
        ))}
      </div>

      {/* Step 1 — Kontakt */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-espresso">Tvoje kontaktní údaje</h3>

          <Field label="Jméno a příjmení *">
            <input
              value={form.applicant_name}
              onChange={e => update('applicant_name', e.target.value)}
              placeholder="Jana Nováková"
              className={inputCls}
            />
          </Field>

          <Field label="E-mail *">
            <input
              type="email"
              value={form.applicant_email}
              onChange={e => update('applicant_email', e.target.value)}
              placeholder="jana@email.cz"
              className={inputCls}
            />
          </Field>

          <Field label="Telefon">
            <input
              type="tel"
              value={form.applicant_phone}
              onChange={e => update('applicant_phone', e.target.value)}
              placeholder="+420 777 123 456"
              className={inputCls}
            />
          </Field>

          <Field label="Lokalita — město / obec *">
            <input
              value={form.applicant_city}
              onChange={e => update('applicant_city', e.target.value)}
              placeholder="Praha · Brno · Liberec…"
              className={inputCls}
            />
          </Field>

          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={() => setStep(2)}
            disabled={!form.applicant_name || !form.applicant_email || !form.applicant_city}
          >
            Pokračovat →
          </Button>
        </div>
      )}

      {/* Step 2 — Bydlení */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-espresso">Kde bydlíš?</h3>

          <Field label="Typ bydlení *">
            <select
              value={form.housing_type}
              onChange={e => update('housing_type', e.target.value)}
              className={`${inputCls} bg-white cursor-pointer`}
            >
              <option value="">Vyber...</option>
              <option value="house">Rodinný dům</option>
              <option value="apartment">Byt</option>
              <option value="farm">Farma / statek</option>
              <option value="other">Jiné</option>
            </select>
          </Field>

          <Field label="Máš zahradu?">
            <YesNo value={form.has_garden} onChange={v => update('has_garden', v)} />
          </Field>

          <Field label="Máš děti?">
            <YesNo value={form.has_children} onChange={v => update('has_children', v)} />
          </Field>

          {form.has_children === 'true' && (
            <Field label="Věk dětí">
              <input
                value={form.children_ages}
                onChange={e => update('children_ages', e.target.value)}
                placeholder="např. 5, 8, 12 let"
                className={inputCls}
              />
            </Field>
          )}

          <Field label="Máš jiná zvířata?">
            <input
              value={form.other_pets}
              onChange={e => update('other_pets', e.target.value)}
              placeholder="např. kočka, pes, žádná"
              className={inputCls}
            />
          </Field>

          <div className="flex gap-3">
            <Button variant="sand" className="flex-1 justify-center" onClick={() => setStep(1)}>
              ← Zpět
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center"
              onClick={() => setStep(3)}
              disabled={!form.housing_type}
            >
              Pokračovat →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Životní styl */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-espresso">Životní styl a péče</h3>

          <Field label="Důvod pořízení *">
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'family', label: '🏡 Rodinný pes' },
                { val: 'sport',  label: '🏃 Aktivní / sport' },
                { val: 'guard',  label: '🛡️ Hlídací pes' },
                { val: 'other',  label: '… Jiné' },
              ].map(({ val, label }) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => update('purpose', val)}
                  className={`py-2.5 rounded-sm font-body text-sm font-bold border-2 transition-all cursor-pointer
                    ${form.purpose === val ? 'bg-coral text-white border-coral' : 'bg-white text-gray border-gray-pale hover:border-coral'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Hodin doma sám — týden">
              <input
                type="number"
                min={0}
                max={24}
                value={form.hours_alone_weekday}
                onChange={e => update('hours_alone_weekday', e.target.value)}
                placeholder="např. 8"
                className={inputCls}
              />
            </Field>
            <Field label="Hodin doma sám — víkend">
              <input
                type="number"
                min={0}
                max={24}
                value={form.hours_alone_weekend}
                onChange={e => update('hours_alone_weekend', e.target.value)}
                placeholder="např. 2"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Kdo se o zvíře postará, když nebudete moct? *">
            <textarea
              value={form.backup_caregiver}
              onChange={e => update('backup_caregiver', e.target.value)}
              placeholder="Rodiče v Brně, partner, sestra, hlídací služba…"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex gap-3">
            <Button variant="sand" className="flex-1 justify-center" onClick={() => setStep(2)}>
              ← Zpět
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center"
              onClick={() => setStep(4)}
              disabled={!form.purpose || !form.backup_caregiver.trim()}
            >
              Pokračovat →
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Motivace */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-espresso">Proč chceš adoptovat {animalName}?</h3>

          <Field label="Zkušenosti se zvířaty">
            <textarea
              value={form.experience}
              onChange={e => update('experience', e.target.value)}
              placeholder="Měl/a jsem psa celé dětství, rozumím jejich potřebám..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Field label="Motivace k adopci *">
            <textarea
              value={form.motivation}
              onChange={e => update('motivation', e.target.value)}
              placeholder={`Proč chceš adoptovat právě ${animalName}? Co mu/jí můžeš nabídnout?`}
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Field label="Zpráva pro útulek">
            <textarea
              value={form.application_message}
              onChange={e => update('application_message', e.target.value)}
              placeholder="Chcete něco sdělit útulku? Dotazy, doplňující info..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {error && (
            <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="sand" className="flex-1 justify-center" onClick={() => setStep(3)}>
              ← Zpět
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center"
              loading={loading}
              onClick={handleSubmit}
              disabled={!form.motivation}
            >
              Odeslat žádost 🐾
            </Button>
          </div>
        </div>
      )}
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

function YesNo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      {[{ val: 'true', label: 'Ano' }, { val: 'false', label: 'Ne' }].map(({ val, label }) => (
        <button
          type="button"
          key={val}
          onClick={() => onChange(val)}
          className={`flex-1 py-2.5 rounded-sm font-body text-sm font-bold border-2 transition-all cursor-pointer
            ${value === val ? 'bg-coral text-white border-coral' : 'bg-white text-gray border-gray-pale hover:border-coral'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
