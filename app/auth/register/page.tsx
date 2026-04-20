'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'

type Mode = 'visitor' | 'shelter' | 'advertiser'

const inputCls = 'w-full px-4 py-3 border-2 border-border rounded-xl text-sm outline-none focus:border-coral transition-colors bg-white text-text-primary'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</label>
      {children}
    </div>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') as Mode | null

  const [mode,     setMode]     = useState<Mode>(typeParam ?? 'visitor')
  const [step,     setStep]     = useState<'form' | 'verify'>('form')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [newsletter,    setNewsletter]    = useState(false)

  const isInstitution = mode === 'shelter'
  const isAdvertiser  = mode === 'advertiser'

  const handleRegister = async () => {
    if (!name)     { setError(isInstitution ? 'Vyplň název instituce' : isAdvertiser ? 'Vyplň název firmy' : 'Vyplň své jméno'); return }
    if (!email || !password) { setError('Vyplň e-mail a heslo'); return }
    if (password.length < 8) { setError('Heslo musí mít alespoň 8 znaků'); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const role = isInstitution ? 'institution_admin' : isAdvertiser ? 'advertiser' : 'public'
    const redirectNext = isInstitution ? '/auth/pending' : isAdvertiser ? '/portal' : '/profil'

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:        name,
          role,
          institution_type: isInstitution ? mode : null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectNext}`,
      },
    })

    if (authError) {
      setError(authError.message.includes('already registered')
        ? 'Tento e-mail je již registrován. Přihlas se.'
        : authError.message)
      setLoading(false)
      return
    }

    // Přihlásit k newsletteru pokud zaškrtl
    if (newsletter) {
      fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      }).catch(() => {/* fire-and-forget */})
    }

    setStep('verify')
    setLoading(false)
  }

  if (step === 'verify') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center">
        <div className="text-5xl mb-5">📬</div>
        <h2 className="font-display font-extrabold text-xl text-text-primary mb-2">Zkontroluj e-mail</h2>
        <p className="text-sm mb-1 text-text-muted">Poslali jsme ověřovací odkaz na</p>
        <p className="font-bold text-text-primary mb-5">{email}</p>
        <p className="text-sm mb-6 text-text-muted">
          Klikni na odkaz v e-mailu a účet bude aktivován. Zkontroluj i spam.
        </p>
        <Link href="/auth/login"
          className="inline-flex px-6 py-3 rounded-xl font-bold text-sm text-white no-underline bg-coral">
          Zpět na přihlášení
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      <h1 className="font-display font-extrabold text-2xl text-text-primary mb-6">Registrace</h1>

      {/* Přepínač typu */}
      <div className="grid grid-cols-3 gap-2 mb-6 p-1 rounded-xl bg-sand">
        {([
          { id: 'visitor',    label: '👤 Návštěvník' },
          { id: 'shelter',    label: '🏠 Útulek' },
          { id: 'advertiser', label: '📣 Inzerent' },
        ] as { id: Mode; label: string }[]).map(opt => (
          <button key={opt.id} onClick={() => setMode(opt.id)}
            className={`py-2 px-1 rounded-lg text-xs font-bold cursor-pointer border-none transition-all
              ${mode === opt.id
                ? 'bg-white text-text-primary shadow-sm'
                : 'bg-transparent text-text-muted'
              }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Popis */}
      <div className={`mb-5 px-3 py-2.5 rounded-xl text-xs
        ${mode === 'visitor' ? 'bg-sand text-text-body'
        : mode === 'advertiser' ? 'bg-[#FEF9E7] text-[#854F0B]'
        : 'bg-coral-tag-bg text-coral-tag-text'}`}>
        {mode === 'visitor'    && 'Sleduj oblíbená zvířata, posílej žádosti o adopci a stávej se dobrovolníkem.'}
        {mode === 'shelter'    && 'Registruj útulek, spravuj zvířata, přijímej adopční žádosti a vytvářej sbírky.'}
        {mode === 'advertiser' && 'Inzeruj na Zozio a oslovte tisíce milovníků zvířat v ČR a SR. Spravuj reklamy přes portál inzerentů.'}
      </div>

      <div className="space-y-4">
        <Field label={isInstitution ? 'Název instituce *' : isAdvertiser ? 'Název firmy *' : 'Jméno *'}>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder={isInstitution ? 'Útulek Praha Chodov' : isAdvertiser ? 'Firma s.r.o.' : 'Jana Nováková'}
            className={inputCls} />
        </Field>
        <Field label="E-mail *">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="vas@email.cz" className={inputCls} />
        </Field>
        <Field label="Heslo * (min. 8 znaků)">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            placeholder="••••••••" className={inputCls} />
        </Field>

        {/* Newsletter opt-in */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={e => setNewsletter(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#E8634A] flex-shrink-0"
          />
          <span className="text-xs leading-relaxed" style={{ color: '#6B4030' }}>
            Chci dostávat novinky Zozio — měsíčně informace o adopcích, záchranách a zvířatech hledajících domov. Odhlásit se lze kdykoli.
          </span>
        </label>

        {error && (
          <div className="text-sm font-semibold px-4 py-3 rounded-xl bg-coral-tag-bg text-coral-tag-text">
            ⚠️ {error}
          </div>
        )}

        <Button variant="primary" className="w-full justify-center" loading={loading} onClick={handleRegister}>
          {isInstitution ? 'Zaregistrovat instituci →' : isAdvertiser ? 'Zaregistrovat firmu →' : 'Vytvořit účet →'}
        </Button>

        <p className="text-xs text-center text-text-muted">
          Registrací souhlasíš s{' '}
          <Link href="/podminky" className="underline text-coral">podmínkami použití</Link>
          {' '}a{' '}
          <Link href="/ochrana-dat" className="underline text-coral">ochranou osobních údajů</Link>.
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-text-muted">
          Už máš účet?{' '}
          <Link href="/auth/login" className="font-bold no-underline hover:opacity-70 text-coral">
            Přihlásit se
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-warm">
      <div className="w-full max-w-[460px]">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
          </Link>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-border p-8 flex justify-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin border-coral border-t-transparent" />
          </div>
        }>
          <RegisterForm />
        </Suspense>

        <p className="text-center text-xs mt-6">
          <Link href="/" className="hover:opacity-70 no-underline text-text-muted">
            ← Zpět na web
          </Link>
        </p>
      </div>
    </div>
  )
}
