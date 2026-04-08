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

export function AdoptionForm({ animalId, animalName, institutionId, initialName = '', initialEmail = '' }: AdoptionFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    applicant_name:      initialName,
    applicant_email:     initialEmail,
    applicant_phone:     '',
    housing_type:        '',
    has_garden:          '',
    other_pets:          '',
    has_children:        '',
    children_ages:       '',
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
          has_garden:   form.has_garden === 'true',
          has_children: form.has_children === 'true',
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

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-pill transition-all ${s <= step ? 'bg-coral' : 'bg-gray-pale'}`} />
        ))}
      </div>

      {/* Step 1 — Kontakt */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-espresso">Tvoje kontaktní údaje</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Jméno a příjmení *</label>
            <input
              value={form.applicant_name}
              onChange={e => update('applicant_name', e.target.value)}
              placeholder="Jana Nováková"
              className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">E-mail *</label>
            <input
              type="email"
              value={form.applicant_email}
              onChange={e => update('applicant_email', e.target.value)}
              placeholder="jana@email.cz"
              className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Telefon</label>
            <input
              type="tel"
              value={form.applicant_phone}
              onChange={e => update('applicant_phone', e.target.value)}
              placeholder="+420 777 123 456"
              className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors"
            />
          </div>

          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={() => setStep(2)}
            disabled={!form.applicant_name || !form.applicant_email}
          >
            Pokračovat →
          </Button>
        </div>
      )}

      {/* Step 2 — Bydlení */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-espresso">Kde bydlíš?</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Typ bydlení *</label>
            <select
              value={form.housing_type}
              onChange={e => update('housing_type', e.target.value)}
              className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors bg-white cursor-pointer"
            >
              <option value="">Vyber...</option>
              <option value="house">Rodinný dům</option>
              <option value="apartment">Byt</option>
              <option value="farm">Farma / statek</option>
              <option value="other">Jiné</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Máš zahradu?</label>
            <div className="flex gap-3">
              {[{ val: 'true', label: 'Ano' }, { val: 'false', label: 'Ne' }].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => update('has_garden', val)}
                  className={`flex-1 py-2.5 rounded-sm font-body text-sm font-bold border-2 transition-all cursor-pointer
                    ${form.has_garden === val ? 'bg-coral text-white border-coral' : 'bg-white text-gray border-gray-pale hover:border-coral'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Máš děti?</label>
            <div className="flex gap-3">
              {[{ val: 'true', label: 'Ano' }, { val: 'false', label: 'Ne' }].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => update('has_children', val)}
                  className={`flex-1 py-2.5 rounded-sm font-body text-sm font-bold border-2 transition-all cursor-pointer
                    ${form.has_children === val ? 'bg-coral text-white border-coral' : 'bg-white text-gray border-gray-pale hover:border-coral'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.has_children === 'true' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brown uppercase tracking-wider">Věk dětí</label>
              <input
                value={form.children_ages}
                onChange={e => update('children_ages', e.target.value)}
                placeholder="např. 5, 8, 12 let"
                className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Máš jiná zvířata?</label>
            <input
              value={form.other_pets}
              onChange={e => update('other_pets', e.target.value)}
              placeholder="např. kočka, pes, žádná"
              className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors"
            />
          </div>

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

      {/* Step 3 — Motivace */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-espresso">Proč chceš adoptovat {animalName}?</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Zkušenosti se zvířaty</label>
            <textarea
              value={form.experience}
              onChange={e => update('experience', e.target.value)}
              placeholder="Měl/a jsem psa celé dětství, rozumím jejich potřebám..."
              rows={3}
              className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Motivace k adopci *</label>
            <textarea
              value={form.motivation}
              onChange={e => update('motivation', e.target.value)}
              placeholder={`Proč chceš adoptovat právě ${animalName}? Co mu/jí můžeš nabídnout?`}
              rows={4}
              className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brown uppercase tracking-wider">Zpráva pro útulek</label>
            <textarea
              value={form.application_message}
              onChange={e => update('application_message', e.target.value)}
              placeholder="Chcete něco sdělit útulku? Dotazy, doplňující info..."
              rows={3}
              className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="sand" className="flex-1 justify-center" onClick={() => setStep(2)}>
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
