'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface FundraiserFormProps {
  institutionId: string
  institutionType: string
  mode: 'create' | 'edit'
  fundraiser?: any
  hasDarujmeCredentials: boolean
}

export function FundraiserForm({
  institutionId, institutionType, mode, fundraiser, hasDarujmeCredentials,
}: FundraiserFormProps) {
  const router    = useRouter()
  const isShelter = institutionType === 'shelter'

  const [form, setForm] = useState({
    title:               fundraiser?.title               ?? '',
    description:         fundraiser?.description         ?? '',
    goal_amount:         fundraiser?.goal_amount         ?? '',
    deadline:            fundraiser?.deadline            ? fundraiser.deadline.slice(0, 10) : '',
    active:              fundraiser?.active              ?? true,
    image_url:           fundraiser?.image_url           ?? '',
    darujme_project_id:  fundraiser?.darujme_project_id  ?? '',
    darujme_url:         fundraiser?.darujme_url         ?? '',
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

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
      institution_id:      institutionId,
      title:               form.title,
      description:         form.description        || null,
      goal_amount:         parseInt(form.goal_amount),
      deadline:            form.deadline            || null,
      active:              form.active,
      image_url:           form.image_url           || null,
      darujme_project_id:  form.darujme_project_id  || null,
      darujme_url:         form.darujme_url         || null,
      // clear animal/rescue_case links — concept changed to per-institution
      animal_id:      null,
      rescue_case_id: null,
    }

    const url    = mode === 'create' ? '/api/fundraisers' : `/api/fundraisers/${fundraiser.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
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

  const pct = form.goal_amount
    ? Math.min(Math.round(((fundraiser?.current_amount ?? 0) / Number(form.goal_amount)) * 100), 100)
    : 0

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
                placeholder="Pomoz nám opravit venkovní výběhy"
                className={inputCls}
              />
            </Field>
            <Field label="Popis sbírky">
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Popis uvidí návštěvníci na stránce sbírky. Napiš proč potřebujete pomoc a jak budou peníze využity."
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <Field label="Obrázek sbírky (URL)">
              <input
                value={form.image_url}
                onChange={e => update('image_url', e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
              <p className="text-[11px] text-gray">
                Odkaz na fotku (JPG/PNG). Pokud necháš prázdné, použije se cover foto instituce.
              </p>
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
                  placeholder="50000"
                  className={inputCls}
                />
              </Field>
              <Field label="Termín sbírky (volitelné)">
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => update('deadline', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
            {mode === 'edit' && fundraiser?.darujme_project_id && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{ background: '#f0fdf4', color: '#166534' }}>
                ✅ Vybraná částka se aktualizuje automaticky z darujme.cz
              </div>
            )}
          </div>
        </div>

        {/* Darujme integrace */}
        <div className="bg-white rounded-lg border border-gray-pale shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 md:px-6 py-4 border-b border-gray-pale"
            style={{ background: 'linear-gradient(135deg, #fff9f0, #fff)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: '#fef3e2' }}>
              💛
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-espresso">
                Propojit s darujme.cz
              </h2>
              <p className="text-xs text-gray">
                Volitelné — automaticky stahuje aktuální stav sbírky
              </p>
            </div>
          </div>

          <div className="px-5 md:px-6 py-5 space-y-5">

            {/* Upozornění pokud nemá credentials */}
            {!hasDarujmeCredentials && (
              <div className="flex items-start gap-3 p-4 rounded-lg border"
                style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                <span className="text-lg flex-shrink-0">⚠️</span>
                <div className="text-sm" style={{ color: '#92400e' }}>
                  <strong>Nejdříve nastav API klíče</strong> — jdi do{' '}
                  <a href="/admin/settings" className="underline font-semibold hover:opacity-70">
                    Nastavení → Propojení s darujme.cz
                  </a>
                  {' '}a zadej svůj API ID a API Secret.
                  Bez toho synchronizace nebude fungovat.
                </div>
              </div>
            )}

            {/* Jak najít Project ID */}
            <div className="p-4 rounded-lg" style={{ background: '#f8f7f5' }}>
              <p className="text-xs font-bold text-brown uppercase tracking-wider mb-2">
                Jak najít ID sbírky na darujme.cz
              </p>
              <p className="text-xs text-gray leading-relaxed">
                Otevři svou sbírku na darujme.cz. Podívej se na adresu v prohlížeči — bude vypadat nějak takto:{' '}
                <code className="bg-white border border-gray-pale px-1.5 py-0.5 rounded text-[11px] font-semibold text-espresso">
                  darujme.cz/projekt/<strong>1212813</strong>
                </code>
                {' '}nebo{' '}
                <code className="bg-white border border-gray-pale px-1.5 py-0.5 rounded text-[11px] font-semibold text-espresso">
                  darujme.cz/kocky-za-humny
                </code>
                {' '}— v takovém případě ID najdeš v administraci sbírky na darujme.cz.
                Číslo zkopíruj a vlož do pole níže.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Darujme Project ID">
                <input
                  value={form.darujme_project_id}
                  onChange={e => update('darujme_project_id', e.target.value)}
                  placeholder="např. 1212813"
                  className={inputCls}
                />
              </Field>
              <Field label="Odkaz na sbírku (URL na darujme.cz)">
                <input
                  value={form.darujme_url}
                  onChange={e => update('darujme_url', e.target.value)}
                  placeholder="https://www.darujme.cz/kocky-za-humny"
                  className={inputCls}
                />
                <p className="text-[11px] text-gray">
                  Tlačítko „Přispět" na Zozio odkáže přímo sem.
                </p>
              </Field>
            </div>
          </div>
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
            Neaktivní sbírky se nezobrazují návštěvníkům.
          </p>
        </div>

        {/* Progress náhled */}
        {form.goal_amount && mode === 'edit' && (
          <div className="bg-amber-light rounded-lg p-5">
            <h3 className="font-display font-bold text-sm text-espresso mb-3">Aktuální stav</h3>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-bold">{(fundraiser?.current_amount ?? 0).toLocaleString('cs-CZ')} Kč</span>
              <span className="text-gray text-xs">z {Number(form.goal_amount).toLocaleString('cs-CZ')} Kč</span>
            </div>
            <div className="w-full h-3 bg-white rounded-pill overflow-hidden">
              <div
                className="h-full bg-coral rounded-pill transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs text-coral font-bold mt-1">{pct}% vybráno</div>
            {fundraiser?.darujme_synced_at && (
              <p className="text-[11px] text-gray mt-2">
                🔄 Sync: {new Date(fundraiser.darujme_synced_at).toLocaleString('cs-CZ')}
              </p>
            )}
            {fundraiser?.darujme_donors_count > 0 && (
              <p className="text-xs text-gray mt-1">
                👥 {fundraiser.darujme_donors_count} dárců
              </p>
            )}
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
