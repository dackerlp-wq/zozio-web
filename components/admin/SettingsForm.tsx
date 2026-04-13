'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { Institution } from '@/types/database'

interface SettingsFormProps {
  institution: Institution
  userRole: string
}

export function SettingsForm({ institution, userRole }: SettingsFormProps) {
  const router    = useRouter()
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
    lat:               institution.lat               ?? '',
    lng:               institution.lng               ?? '',
    facebook_url:      institution.facebook_url      ?? '',
    instagram_url:     institution.instagram_url     ?? '',
    opening_hours:     institution.opening_hours     ?? '',
  })

  const [logoUrl,  setLogoUrl]  = useState<string>(institution.logo_url  ?? '')
  const [coverUrl, setCoverUrl] = useState<string>(institution.cover_url ?? '')

  const [logoUploading,  setLogoUploading]  = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Darujme credentials
  const [darujmeApiId,     setDarujmeApiId]     = useState<string>(institution.darujme_api_id     ?? '')
  const [darujmeApiSecret, setDarujmeApiSecret] = useState<string>(institution.darujme_api_secret ?? '')
  const [darujmeLoading,   setDarujmeLoading]   = useState(false)
  const [darujmeSuccess,   setDarujmeSuccess]   = useState(false)
  const [darujmeError,     setDarujmeError]     = useState<string | null>(null)
  const [showSecret,       setShowSecret]       = useState(false)

  const logoRef  = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  /* ── Upload obrázku do Supabase Storage ── */
  const uploadImage = async (
    file: File,
    type: 'logo' | 'cover',
    setUrl: (url: string) => void,
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true)
    setError(null)

    const maxMB   = type === 'logo' ? 2 : 5
    const maxBytes = maxMB * 1024 * 1024
    if (file.size > maxBytes) {
      setError(`Soubor je příliš velký. Maximum je ${maxMB} MB.`)
      setUploading(false)
      return
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Povolené formáty: JPG, PNG, WebP.')
      setUploading(false)
      return
    }

    const supabase = createClient()
    const ext      = file.name.split('.').pop()
    const path     = `institutions/${institution.id}/${type}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('institution-assets')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (upErr) {
      setError(`Chyba při nahrávání: ${upErr.message}`)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('institution-assets').getPublicUrl(path)
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`
    setUrl(publicUrl)

    // Ulož URL do databáze
    await fetch(`/api/institutions/${institution.id}/settings`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ [type === 'logo' ? 'logo_url' : 'cover_url']: publicUrl }),
    })

    setUploading(false)
    router.refresh()
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/institutions/${institution.id}/settings`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
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

        {/* Sociální sítě */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-1">
            Sociální sítě
          </h2>
          <p className="text-xs text-gray mb-4">
            Zobrazí se na veřejném profilu v sekci Kontakt.
          </p>
          <div className="space-y-4">
            <Field label="Facebook">
              <input
                value={form.facebook_url}
                onChange={e => update('facebook_url', e.target.value)}
                placeholder="https://www.facebook.com/vas-utulek"
                className={inputCls}
              />
            </Field>
            <Field label="Instagram">
              <input
                value={form.instagram_url}
                onChange={e => update('instagram_url', e.target.value)}
                placeholder="https://www.instagram.com/vas-utulek"
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

            {/* GPS souřadnice */}
            <div className="pt-2 border-t border-gray-pale">
              <div className="flex items-start gap-2 mb-3">
                <div>
                  <div className="text-xs font-bold text-brown uppercase tracking-wider mb-0.5">
                    GPS souřadnice
                  </div>
                  <p className="text-xs text-gray">
                    Slouží pro zobrazení vzdálenosti od uživatele a mapu na profilu.
                    Najdeš je na{' '}
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                      className="text-coral font-semibold hover:underline">
                      Google Maps
                    </a>
                    {' '}— klikni pravým tlačítkem na místo → zkopíruj souřadnice.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Zeměpisná šířka (lat)">
                  <input
                    type="number"
                    step="0.000001"
                    value={form.lat ?? ''}
                    onChange={e => update('lat', e.target.value)}
                    placeholder="50.075538"
                    className={inputCls}
                  />
                </Field>
                <Field label="Zeměpisná délka (lng)">
                  <input
                    type="number"
                    step="0.000001"
                    value={form.lng ?? ''}
                    onChange={e => update('lng', e.target.value)}
                    placeholder="14.437801"
                    className={inputCls}
                  />
                </Field>
              </div>
              {form.lat && form.lng && (
                <a
                  href={`https://www.google.com/maps?q=${form.lat},${form.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-coral mt-2 hover:opacity-70 transition-opacity"
                >
                  📍 Ověřit polohu v Google Maps →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Provozní hodiny */}
        <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm">
          <h2 className="font-display font-extrabold text-lg md:text-xl text-espresso mb-1">
            Provozní hodiny
          </h2>
          <p className="text-xs text-gray mb-4">
            Zobrazí se na veřejném profilu v sekci O nás. Piš volně — např. Po–Pá: 8:00–17:00
          </p>
          <Field label="Provozní hodiny">
            <textarea
              value={form.opening_hours}
              onChange={e => update('opening_hours', e.target.value)}
              placeholder={'Po–Pá: 8:00–17:00\nSo: 9:00–12:00\nNe: zavřeno'}
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        {/* ── Darujme.cz integrace ── */}
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

      </div>

      {/* Pravý panel */}
      <div className="space-y-5">

        {/* ── LOGO ── */}
        <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
          <h3 className="font-display font-bold text-sm text-espresso mb-1 uppercase tracking-wider">Logo</h3>
          <p className="text-xs text-gray mb-3">
            Čtvercové logo instituce · <strong>JPG, PNG nebo WebP</strong> · max. 2 MB
            <br />Ideální rozměr: <strong>400 × 400 px</strong>
          </p>

          {/* Preview */}
          <div className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-pale mb-3 flex items-center justify-center text-3xl
            ${isShelter ? 'bg-coral-tag-bg' : 'bg-rescue-tag-bg'}`}>
            {logoUrl
              ? <Image src={logoUrl} alt="Logo" fill className="object-cover" />
              : <span>{isShelter ? '🏠' : '🚑'}</span>
            }
            {logoUploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="text-xs font-bold text-espresso">...</span>
              </div>
            )}
          </div>

          <input
            ref={logoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) uploadImage(file, 'logo', setLogoUrl, setLogoUploading)
            }}
          />
          <button
            type="button"
            onClick={() => logoRef.current?.click()}
            disabled={logoUploading}
            className="text-xs font-bold text-coral border border-coral/30 bg-coral-light px-3 py-1.5 rounded-sm cursor-pointer hover:bg-coral hover:text-white transition-all disabled:opacity-50"
          >
            {logoUploading ? 'Nahrávám...' : logoUrl ? 'Změnit logo' : 'Nahrát logo'}
          </button>
        </div>

        {/* ── COVER ── */}
        <div className="bg-white rounded-lg p-5 border border-gray-pale shadow-sm">
          <h3 className="font-display font-bold text-sm text-espresso mb-1 uppercase tracking-wider">Cover foto</h3>
          <p className="text-xs text-gray mb-3">
            Horizontální fotka v záhlaví profilu · <strong>JPG, PNG nebo WebP</strong> · max. 5 MB
            <br />Ideální rozměr: <strong>1200 × 400 px</strong> (poměr 3:1)
          </p>

          {/* Preview */}
          <div className="relative w-full h-20 rounded-xl overflow-hidden border-2 border-gray-pale mb-3 flex items-center justify-center"
            style={{ background: isShelter
              ? 'linear-gradient(135deg, var(--espresso), var(--coral))'
              : 'linear-gradient(135deg, #1C2E28, var(--rescue))' }}>
            {coverUrl
              ? <Image src={coverUrl} alt="Cover" fill className="object-cover opacity-80" />
              : <span className="text-xs text-white/60 font-medium">Žádné cover foto</span>
            }
            {coverUploading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <span className="text-xs font-bold text-espresso">Nahrávám...</span>
              </div>
            )}
          </div>

          <input
            ref={coverRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) uploadImage(file, 'cover', setCoverUrl, setCoverUploading)
            }}
          />
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            disabled={coverUploading}
            className="text-xs font-bold text-coral border border-coral/30 bg-coral-light px-3 py-1.5 rounded-sm cursor-pointer hover:bg-coral hover:text-white transition-all disabled:opacity-50"
          >
            {coverUploading ? 'Nahrávám...' : coverUrl ? 'Změnit cover' : 'Nahrát cover'}
          </button>
        </div>

        {/* Typ a stav */}
        <div className={`rounded-lg p-5 ${isShelter ? 'bg-shelter-bg' : 'bg-rescue-bg'}`}>
          <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isShelter ? 'text-shelter-dark' : 'text-rescue-dark'}`}>
            Typ instituce
          </div>
          <div className="font-display font-extrabold text-xl text-espresso">
            {isShelter ? '🏠 Útulek' : '🚑 Záchranná stanice'}
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
