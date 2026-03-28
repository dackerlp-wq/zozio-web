'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface SettingsFormProps {
  institution: any
  userRole: string
}

export function SettingsForm({ institution, userRole }: SettingsFormProps) {
  const router = useRouter()
  const isShelter = institution.type === 'shelter'

  const [form, setForm] = useState({
    name:              institution.name              ?? '',
    short_description: institution.short_description ?? '',
    description:       institution.description       ?? '',
    email:             institution.email             ?? '',
    phone:             institution.phone             ?? '',
    website:           institution.website           ?? '',
    street:            institution.street            ?? '',
    city:              institution.city              ?? '',
    postal_code:       institution.postal_code       ?? '',
  })

  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/institutions/${institution.id}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Chyba při ukládání')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  const inputCls = 'px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors w-full bg-white'

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">

      {/* Levý panel — hlavní */}
      <div className="lg:col-span-2 space-y-5">

        {/* Základní info */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-4">
            Základní informace
          </h2>
          <div className="space-y-4">
            <Field label="Název instituce *">
              <input
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="Útulok Praha Chodov"
                className={inputCls}
              />
            </Field>
            <Field label="Krátký popis (zobrazí se v kartičce, max. 120 znaků)">
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
        </div>

        {/* Kontaktní údaje */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-4">
            Kontaktní údaje
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="E-mail *">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="info@utulok.cz"
                  className={inputCls}
                />
              </Field>
              <Field label="Telefon">
                <input
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="+420 777 123 456"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Webová stránka">
              <input
                value={form.website}
                onChange={e => update('website', e.target.value)}
                placeholder="https://vas-utulek.cz"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Adresa */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-4">
            Adresa
          </h2>
          <div className="space-y-4">
            <Field label="Ulice a číslo popisné">
              <input
                value={form.street}
                onChange={e => update('street', e.target.value)}
                placeholder="Chodovská 123"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Město *">
                <input
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                  placeholder="Praha"
                  className={inputCls}
                />
              </Field>
              <Field label="PSČ">
                <input
                  value={form.postal_code}
                  onChange={e => update('postal_code', e.target.value)}
                  placeholder="14100"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      {/* Pravý panel */}
      <div className="space-y-5">

        {/* Typ a stav */}
        <div className={`rounded-lg p-5 ${isShelter ? 'bg-shelter-bg' : 'bg-rescue-bg'}`}>
          <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isShelter ? 'text-shelter-dark' : 'text-rescue-dark'}`}>
            Typ instituce
          </div>
          <div className="font-display font-extrabold text-xl text-espresso">
            {isShelter ? '🏠 Útulok' : '🚑 Záchranná stanice'}
          </div>
          <div className={`text-xs font-semibold mt-2 ${institution.approval_status === 'approved' ? 'text-success' : 'text-warning'}`}>
            {institution.approval_status === 'approved' ? '✓ Schváleno' : '⏳ Čeká na schválení'}
          </div>
          <div className="text-xs text-gray mt-1">
            Plán: <strong>{institution.plan?.toUpperCase()}</strong>
          </div>
        </div>

        {/* Veřejný profil odkaz */}
        <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
          <h3 className="font-display font-bold text-sm text-espresso mb-3 uppercase tracking-wider">
            Veřejný profil
          </h3>
          <a
            href={`/institutions/${institution.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-coral hover:text-coral-dark transition-colors break-all"
          >
            zozio.cz/institutions/{institution.slug} ↗
          </a>
        </div>

        {/* Uložit */}
        {error && (
          <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-success-bg text-success text-sm font-semibold px-4 py-3 rounded-sm">
            ✓ Nastavení bylo uloženo
          </div>
        )}

        <Button
          variant="primary"
          className="w-full justify-center"
          loading={loading}
          onClick={handleSave}
        >
          Uložit nastavení
        </Button>
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
