'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface DarujmeFormProps {
  institution: {
    id: string
    darujme_api_id?: string | null
    darujme_api_secret?: string | null
    [key: string]: unknown
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-brown uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

export function DarujmeForm({ institution }: DarujmeFormProps) {
  const router = useRouter()

  const [darujmeApiId,     setDarujmeApiId]     = useState<string>(institution.darujme_api_id     ?? '')
  const [darujmeApiSecret, setDarujmeApiSecret] = useState<string>(institution.darujme_api_secret ?? '')
  const [darujmeLoading,   setDarujmeLoading]   = useState(false)
  const [darujmeSuccess,   setDarujmeSuccess]   = useState(false)
  const [darujmeError,     setDarujmeError]     = useState<string | null>(null)
  const [showSecret,       setShowSecret]       = useState(false)

  const inputCls = 'px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm text-espresso outline-none focus:border-coral transition-colors w-full bg-white'

  const handleDarujmeSave = async () => {
    setDarujmeLoading(true)
    setDarujmeError(null)
    setDarujmeSuccess(false)
    const res = await fetch('/api/institutions/darujme-credentials', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ darujme_api_id: darujmeApiId, darujme_api_secret: darujmeApiSecret }),
    })
    const data = await res.json()
    if (!res.ok) { setDarujmeError(data.error ?? 'Chyba při ukládání'); setDarujmeLoading(false); return }
    setDarujmeSuccess(true)
    setDarujmeLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-pale shadow-sm overflow-hidden">
      {/* Hlavička */}
      <div className="flex items-center gap-3 px-5 md:px-6 py-4 border-b border-gray-pale"
        style={{ background: 'linear-gradient(135deg, #fff9f0, #fff)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: '#fef3e2' }}>
          💛
        </div>
        <div>
          <h2 className="font-display font-extrabold text-lg text-espresso">
            Propojení s darujme.cz
          </h2>
          <p className="text-xs text-gray">
            Umožní automaticky stahovat aktuální stav sbírek z platformy darujme.cz
          </p>
        </div>
      </div>

      <div className="px-5 md:px-6 py-5 space-y-6">

        {/* Co to dá */}
        <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: '#f0fdf4' }}>
          <span className="text-xl flex-shrink-0 mt-0.5">✅</span>
          <div className="text-sm" style={{ color: '#166534' }}>
            <strong>Co tím získáš:</strong> Vybraná částka a počet dárců na tvých sbírkách se bude
            automaticky aktualizovat každých 10 minut přímo z darujme.cz — nemusíš nic měnit ručně.
          </div>
        </div>

        {/* Krok za krokem */}
        <div>
          <p className="text-xs font-bold text-brown uppercase tracking-wider mb-4">
            Jak na to — krok za krokem
          </p>

          <div className="space-y-4">
            {/* Krok 1 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0 mt-0.5"
                style={{ background: '#E8634A' }}>1</div>
              <div>
                <p className="text-sm font-bold text-espresso mb-1">Vytvoř sbírku na darujme.cz</p>
                <p className="text-xs text-gray leading-relaxed">
                  Jdi na{' '}
                  <a href="https://www.darujme.cz" target="_blank" rel="noopener noreferrer"
                    className="text-coral font-semibold hover:underline">
                    darujme.cz
                  </a>
                  {' '}→ přihlas se → vytvoř nový projekt pro svou organizaci.
                  Pokud sbírku už máš, přejdi na krok 2.
                </p>
              </div>
            </div>

            {/* Krok 2 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0 mt-0.5"
                style={{ background: '#E8634A' }}>2</div>
              <div>
                <p className="text-sm font-bold text-espresso mb-1">Otevři nastavení API na darujme.cz</p>
                <p className="text-xs text-gray leading-relaxed">
                  Po přihlášení klikni na své jméno (vpravo nahoře) →{' '}
                  <strong>Nastavení organizace</strong> →{' '}
                  <strong>API přístup</strong> (nebo <strong>Integrace</strong>).
                </p>
              </div>
            </div>

            {/* Krok 3 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0 mt-0.5"
                style={{ background: '#E8634A' }}>3</div>
              <div>
                <p className="text-sm font-bold text-espresso mb-1">Zkopíruj API ID a API Secret</p>
                <p className="text-xs text-gray leading-relaxed">
                  Na stránce uvidíš dvě hodnoty — <strong>API ID</strong> (číslo, např. <code className="bg-gray-pale px-1 rounded text-[11px]">12345</code>)
                  a <strong>API Secret</strong> (dlouhý kód).
                  Obě hodnoty zkopíruj a vlož níže.
                </p>
              </div>
            </div>

            {/* Krok 4 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0 mt-0.5"
                style={{ background: '#E8634A' }}>4</div>
              <div>
                <p className="text-sm font-bold text-espresso mb-1">Zadej ID sbírky u každé sbírky</p>
                <p className="text-xs text-gray leading-relaxed">
                  Poté jdi do <strong>Sbírky → Nová sbírka</strong> (nebo uprav existující)
                  a zadej <strong>Darujme Project ID</strong> — číslo z URL tvé sbírky na darujme.cz
                  (např. z{' '}
                  <code className="bg-gray-pale px-1 rounded text-[11px]">darujme.cz/projekt/1212813</code>
                  {' '}je ID <strong>1212813</strong>).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulář */}
        <div className="space-y-4 pt-2 border-t border-gray-pale">
          <Field label="API ID">
            <input
              value={darujmeApiId}
              onChange={e => setDarujmeApiId(e.target.value)}
              placeholder="např. 12345"
              className={inputCls}
            />
          </Field>
          <Field label="API Secret">
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={darujmeApiSecret}
                onChange={e => setDarujmeApiSecret(e.target.value)}
                placeholder="Dlouhý tajný kód z darujme.cz"
                className={`${inputCls} pr-16`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowSecret(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray hover:text-espresso cursor-pointer bg-transparent border-none"
              >
                {showSecret ? 'Skrýt' : 'Ukázat'}
              </button>
            </div>
            <p className="text-[11px] text-gray">
              🔒 Uloženo bezpečně — nikdy ho nezobrazujeme třetím stranám.
            </p>
          </Field>

          {darujmeError && (
            <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm">
              ⚠️ {darujmeError}
            </div>
          )}
          {darujmeSuccess && (
            <div className="bg-success-bg text-success text-sm font-semibold px-4 py-3 rounded-sm">
              ✓ API klíče byly uloženy. Synchronizace se spustí automaticky.
            </div>
          )}

          <Button
            variant="primary"
            loading={darujmeLoading}
            onClick={handleDarujmeSave}
          >
            {darujmeApiId ? '✓ Uložit API klíče' : 'Propojit s darujme.cz'}
          </Button>
        </div>
      </div>
    </div>
  )
}
