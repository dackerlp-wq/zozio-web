'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'

type InstitutionType = 'shelter' | 'rescue_station'

interface FormData {
  // Step 1
  type: InstitutionType | ''
  // Step 2
  name: string
  city: string
  street: string
  postal_code: string
  phone: string
  website: string
  // Step 3
  description: string
  short_description: string
  // Step 4
  email: string
  password: string
  password_confirm: string
}

const INITIAL: FormData = {
  type: '',
  name: '', city: '', street: '', postal_code: '', phone: '', website: '',
  description: '', short_description: '',
  email: '', password: '', password_confirm: '',
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (form.password !== form.password_confirm) {
      setError('Hesla se neshodují')
      return
    }
    if (form.password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků')
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/institutions/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        slug: slugify(form.name),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Registrace se nezdařila')
      setLoading(false)
      return
    }

    router.push('/auth/register/success')
  }

  const isShelter = form.type === 'shelter'

  return (
    <div className="min-h-screen bg-warm flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[520px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
          </Link>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-pill transition-all ${s <= step ? (isShelter ? 'bg-coral' : 'bg-rescue') : 'bg-gray-pale'}`} />
              <span className="text-[10px] text-gray font-semibold">
                {s === 1 ? 'Typ' : s === 2 ? 'Info' : s === 3 ? 'Popis' : 'Účet'}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-pale p-8">

          {/* STEP 1 — Typ instituce */}
          {step === 1 && (
            <div>
              <h1 className="font-display font-extrabold text-3xl text-espresso mb-1">
                Registrace instituce
              </h1>
              <p className="text-sm text-gray mb-6 font-semibold">
                Jaký typ instituce chceš zaregistrovat?
              </p>

              <div className="grid grid-cols-1 gap-4 mb-6">
                <button
                  onClick={() => update('type', 'shelter')}
                  className={`p-5 rounded-lg border-2 text-left transition-all cursor-pointer
                    ${form.type === 'shelter'
                      ? 'border-coral bg-coral-light'
                      : 'border-gray-pale hover:border-coral/50'
                    }`}
                >
                  <div className="text-3xl mb-2">🏠</div>
                  <div className="font-display font-extrabold text-lg text-espresso">Útulok</div>
                  <div className="text-sm text-brown-mid mt-1">
                    Zachraňme opuštěná zvířata — psi, kočky, králíci a další domácí zvířata čekající na nový domov.
                  </div>
                </button>

                <button
                  onClick={() => update('type', 'rescue_station')}
                  className={`p-5 rounded-lg border-2 text-left transition-all cursor-pointer
                    ${form.type === 'rescue_station'
                      ? 'border-rescue bg-rescue-bg'
                      : 'border-gray-pale hover:border-rescue/50'
                    }`}
                >
                  <div className="text-3xl mb-2">🚑</div>
                  <div className="font-display font-extrabold text-lg text-espresso">Záchranná stanice</div>
                  <div className="text-sm text-brown-mid mt-1">
                    Zachraňme ohrožená zvířata — záchrana a rehabilitace volně žijících zraněných živočichů.
                  </div>
                </button>
              </div>

              <Button
                variant={form.type === 'rescue_station' ? 'rescue' : 'primary'}
                className="w-full justify-center"
                disabled={!form.type}
                onClick={() => setStep(2)}
              >
                Pokračovat →
              </Button>
            </div>
          )}

          {/* STEP 2 — Základní info */}
          {step === 2 && (
            <div>
              <h2 className="font-display font-extrabold text-2xl text-espresso mb-1">
                {isShelter ? '🏠 Základní informace' : '🚑 Základní informace'}
              </h2>
              <p className="text-sm text-gray mb-6 font-semibold">
                {isShelter ? 'Údaje o vašem útulku' : 'Údaje o vaší záchranné stanici'}
              </p>

              <div className="space-y-4">
                <Field label="Název instituce *" required>
                  <input
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    placeholder={isShelter ? 'Útulok Praha Chodov' : 'Záchranná stanice Jihlava'}
                    className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Město *" required>
                    <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Praha" className={inputCls} />
                  </Field>
                  <Field label="PSČ">
                    <input value={form.postal_code} onChange={e => update('postal_code', e.target.value)} placeholder="14100" className={inputCls} />
                  </Field>
                </div>

                <Field label="Ulice a číslo popisné">
                  <input value={form.street} onChange={e => update('street', e.target.value)} placeholder="Chodovská 123" className={inputCls} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Telefon">
                    <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+420 777 123 456" className={inputCls} />
                  </Field>
                  <Field label="Web">
                    <input value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://vas-utulek.cz" className={inputCls} />
                  </Field>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="sand" className="flex-1 justify-center" onClick={() => setStep(1)}>← Zpět</Button>
                <Button
                  variant={isShelter ? 'primary' : 'rescue'}
                  className="flex-1 justify-center"
                  disabled={!form.name || !form.city}
                  onClick={() => setStep(3)}
                >
                  Pokračovat →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 — Popis */}
          {step === 3 && (
            <div>
              <h2 className="font-display font-extrabold text-2xl text-espresso mb-1">
                Popis instituce
              </h2>
              <p className="text-sm text-gray mb-6 font-semibold">
                Řekni lidem kdo jste a co děláte.
              </p>

              <div className="space-y-4">
                <Field label="Krátký popis (zobrazí se v kartičce)">
                  <input
                    value={form.short_description}
                    onChange={e => update('short_description', e.target.value)}
                    placeholder="Obecní útulok s tradicí přes 20 let..."
                    maxLength={120}
                    className={inputCls}
                  />
                  <span className="text-xs text-gray">{form.short_description.length}/120 znaků</span>
                </Field>

                <Field label="Podrobný popis">
                  <textarea
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    placeholder={isShelter
                      ? 'Jsme útulok v Praze, který pečuje o opuštěná zvířata...'
                      : 'Záchranná stanice pro volně žijící živočichy...'
                    }
                    rows={5}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="sand" className="flex-1 justify-center" onClick={() => setStep(2)}>← Zpět</Button>
                <Button
                  variant={isShelter ? 'primary' : 'rescue'}
                  className="flex-1 justify-center"
                  onClick={() => setStep(4)}
                >
                  Pokračovat →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4 — Účet */}
          {step === 4 && (
            <div>
              <h2 className="font-display font-extrabold text-2xl text-espresso mb-1">
                Vytvořit účet
              </h2>
              <p className="text-sm text-gray mb-6 font-semibold">
                Tvůj administrátorský účet pro správu instituce.
              </p>

              <div className="space-y-4">
                <Field label="E-mail *">
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="vas@email.cz"
                    className={inputCls}
                  />
                </Field>

                <Field label="Heslo * (min. 8 znaků)">
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </Field>

                <Field label="Heslo znovu *">
                  <input
                    type="password"
                    value={form.password_confirm}
                    onChange={e => update('password_confirm', e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </Field>
              </div>

              {error && (
                <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm mt-4">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button variant="sand" className="flex-1 justify-center" onClick={() => setStep(3)}>← Zpět</Button>
                <Button
                  variant={isShelter ? 'primary' : 'rescue'}
                  className="flex-1 justify-center"
                  loading={loading}
                  disabled={!form.email || !form.password || !form.password_confirm}
                  onClick={handleSubmit}
                >
                  Zaregistrovat instituci
                </Button>
              </div>

              <p className="text-xs text-gray text-center mt-4">
                Po registraci bude tvoje instituce zkontrolována a schválena do 24 hodin.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray mt-6">
          Už máš účet?{' '}
          <Link href="/auth/login" className="text-coral font-bold hover:text-coral-dark transition-colors">
            Přihlásit se
          </Link>
        </p>
      </div>
    </div>
  )
}

const inputCls = 'px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors w-full bg-white'

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-brown uppercase tracking-wider">
        {label}{required && <span className="text-coral ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
