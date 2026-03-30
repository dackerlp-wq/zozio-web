'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'

type Mode = 'visitor' | 'shelter' | 'rescue_station'

// useSearchParams musí být v samostatné komponentě uvnitř Suspense
function RegisterForm() {
  const searchParams = useSearchParams()
  const typeParam    = searchParams.get('type') as Mode | null

  const [mode,     setMode]     = useState<Mode>(typeParam ?? 'visitor')
  const [step,     setStep]     = useState<'form' | 'verify'>('form')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const isInstitution = mode !== 'visitor'

  const handleRegister = async () => {
    if (!email || !password) { setError('Vyplň e-mail a heslo'); return }
    if (password.length < 8) { setError('Heslo musí mít alespoň 8 znaků'); return }
    if (!name) { setError(isInstitution ? 'Vyplň název instituce' : 'Vyplň své jméno'); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:        name,
          role:             isInstitution ? 'institution' : 'visitor',
          institution_type: isInstitution ? mode : null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${isInstitution ? '/admin/dashboard' : '/profil'}`,
      },
    })

    if (authError) {
      setError(authError.message.includes('already registered')
        ? 'Tento e-mail je již registrován. Přihlas se.'
        : authError.message)
      setLoading(false)
      return
    }

    setStep('verify')
    setLoading(false)
  }

  if (step === 'verify') {
    return (
      <div className="text-center">
        <div className="text-6xl mb-6">📬</div>
        <h1 className="font-display font-extrabold text-2xl text-[#1A0F0A] mb-3">Zkontroluj e-mail</h1>
        <p className="text-sm mb-2" style={{ color: '#8B6550' }}>Poslali jsme ověřovací odkaz na</p>
        <p className="font-bold text-[#1A0F0A] mb-6">{email}</p>
        <p className="text-sm mb-8" style={{ color: '#8B6550' }}>
          Klikni na odkaz v e-mailu a účet bude aktivován. Zkontroluj i spam.
        </p>
        <Link href="/auth/login"
          className="inline-flex px-6 py-3 rounded-xl font-bold text-sm text-white no-underline"
          style={{ background: '#E8634A' }}>
          Zpět na přihlášení
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-8">
      <h1 className="font-display font-extrabold text-2xl text-[#1A0F0A] mb-6">Registrace</h1>

      {/* Přepínač typu */}
      <div className="grid grid-cols-3 gap-2 mb-6 p-1 rounded-xl" style={{ background: '#F5F0EC' }}>
        {([
          { id: 'visitor',        label: '👤 Návštěvník' },
          { id: 'shelter',        label: '🏠 Útulek' },
          { id: 'rescue_station', label: '🚑 Záchranná' },
        ] as { id: Mode; label: string }[]).map(opt => (
          <button key={opt.id} onClick={() => setMode(opt.id)}
            className="py-2 px-1 rounded-lg text-xs font-bold cursor-pointer border-none transition-all"
            style={mode === opt.id
              ? { background: 'white', color: '#1A0F0A', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
              : { background: 'transparent', color: '#8B6550' }
            }>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Popis */}
      <div className="mb-5 px-3 py-2.5 rounded-xl text-xs" style={{
        background: mode === 'visitor' ? '#F5F0EC' : mode === 'shelter' ? '#FAECE7' : '#E1F5EE',
        color:      mode === 'visitor' ? '#6B4030' : mode === 'shelter' ? '#993C1D' : '#0F6E56',
      }}>
        {mode === 'visitor'        && 'Sleduj oblíbená zvířata, posílej žádosti o adopci a stávej se dobrovolníkem.'}
        {mode === 'shelter'        && 'Registruj útulek, spravuj zvířata, přijímej adopční žádosti a vytvářej sbírky.'}
        {mode === 'rescue_station' && 'Registruj záchrannou stanici, eviduj záchranné případy a přijímej dary.'}
      </div>

      <div className="space-y-4">
        <Field label={isInstitution ? 'Název instituce *' : 'Jméno *'}>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder={isInstitution ? 'Útulek Praha Chodov' : 'Jana Nováková'}
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

        {error && (
          <div className="text-sm font-semibold px-4 py-3 rounded-xl"
            style={{ background: '#FAECE7', color: '#993C1D' }}>
            ⚠️ {error}
          </div>
        )}

        <Button variant="primary" className="w-full justify-center" loading={loading} onClick={handleRegister}>
          {isInstitution ? 'Zaregistrovat instituci →' : 'Vytvořit účet →'}
        </Button>

        <p className="text-xs text-center" style={{ color: '#8B6550' }}>
          Registrací souhlasíš s{' '}
          <Link href="/podminky" className="underline" style={{ color: '#E8634A' }}>podmínkami použití</Link>
          {' '}a{' '}
          <Link href="/ochrana-dat" className="underline" style={{ color: '#E8634A' }}>ochranou osobních údajů</Link>.
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-[#F0EDE8] text-center">
        <p className="text-sm" style={{ color: '#8B6550' }}>
          Už máš účet?{' '}
          <Link href="/auth/login" className="font-bold no-underline hover:opacity-70" style={{ color: '#E8634A' }}>
            Přihlásit se
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#FFFCF8' }}>
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
          </Link>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-[#F0EDE8] p-8 text-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
              style={{ borderColor: '#E8634A', borderTopColor: 'transparent' }} />
          </div>
        }>
          <RegisterForm />
        </Suspense>

        <p className="text-center text-xs mt-6">
          <Link href="/" className="hover:opacity-70 no-underline" style={{ color: '#8B6550' }}>← Zpět na web</Link>
        </p>
      </div>
    </div>
  )
}

  const [mode,     setMode]     = useState<Mode>(typeParam ?? 'visitor')
  const [step,     setStep]     = useState<'form' | 'verify'>('form')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const isInstitution = mode !== 'visitor'

  const handleRegister = async () => {
    if (!email || !password) { setError('Vyplň e-mail a heslo'); return }
    if (password.length < 8) { setError('Heslo musí mít alespoň 8 znaků'); return }
    if (isInstitution && !name) { setError('Vyplň název instituce'); return }
    if (!isInstitution && !name) { setError('Vyplň své jméno'); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:        name,
          role:             isInstitution ? 'institution' : 'visitor',
          institution_type: isInstitution ? mode : null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${isInstitution ? '/admin/dashboard' : '/profil'}`,
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Tento e-mail je již registrován. Přihlas se.')
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    setStep('verify')
    setLoading(false)
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFFCF8' }}>
        <div className="w-full max-w-[420px] text-center">
          <div className="text-6xl mb-6">📬</div>
          <h1 className="font-display font-extrabold text-2xl text-[#1A0F0A] mb-3">
            Zkontroluj e-mail
          </h1>
          <p className="text-sm mb-2" style={{ color: '#8B6550' }}>
            Poslali jsme ověřovací odkaz na
          </p>
          <p className="font-bold text-[#1A0F0A] mb-6">{email}</p>
          <p className="text-sm mb-8" style={{ color: '#8B6550' }}>
            Klikni na odkaz v e-mailu a účet bude aktivován. Zkontroluj i spam.
          </p>
          <Link href="/auth/login"
            className="inline-flex px-6 py-3 rounded-xl font-bold text-sm text-white no-underline"
            style={{ background: '#E8634A' }}>
            Zpět na přihlášení
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#FFFCF8' }}>
      <div className="w-full max-w-[460px]">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-8">
          <h1 className="font-display font-extrabold text-2xl text-[#1A0F0A] mb-6">
            Registrace
          </h1>

          {/* Přepínač typu */}
          <div className="grid grid-cols-3 gap-2 mb-6 p-1 rounded-xl" style={{ background: '#F5F0EC' }}>
            {([
              { id: 'visitor',        label: '👤 Návštěvník' },
              { id: 'shelter',        label: '🏠 Útulek' },
              { id: 'rescue_station', label: '🚑 Záchranná' },
            ] as { id: Mode; label: string }[]).map(opt => (
              <button key={opt.id} onClick={() => setMode(opt.id)}
                className="py-2 px-1 rounded-lg text-xs font-bold cursor-pointer border-none transition-all"
                style={mode === opt.id
                  ? { background: 'white', color: '#1A0F0A', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                  : { background: 'transparent', color: '#8B6550' }
                }>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Popis podle typu */}
          <div className="mb-5 px-3 py-2.5 rounded-xl text-xs" style={{
            background: mode === 'visitor' ? '#F5F0EC' : mode === 'shelter' ? '#FAECE7' : '#E1F5EE',
            color: mode === 'visitor' ? '#6B4030' : mode === 'shelter' ? '#993C1D' : '#0F6E56',
          }}>
            {mode === 'visitor' && 'Sleduj oblíbená zvířata, posílej žádosti o adopci a stávej se dobrovolníkem.'}
            {mode === 'shelter' && 'Registruj útulek, spravuj zvířata, přijímej adopční žádosti a vytvářej sbírky.'}
            {mode === 'rescue_station' && 'Registruj záchrannou stanici, eviduj záchranné případy a přijímej dary.'}
          </div>

          <div className="space-y-4">
            <Field label={isInstitution ? 'Název instituce *' : 'Jméno *'}>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder={isInstitution ? 'Útulek Praha Chodov' : 'Jana Nováková'}
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

            {error && (
              <div className="text-sm font-semibold px-4 py-3 rounded-xl"
                style={{ background: '#FAECE7', color: '#993C1D' }}>
                ⚠️ {error}
              </div>
            )}

            <Button variant="primary" className="w-full justify-center" loading={loading} onClick={handleRegister}>
              {isInstitution ? 'Zaregistrovat instituci →' : 'Vytvořit účet →'}
            </Button>

            <p className="text-xs text-center" style={{ color: '#8B6550' }}>
              Registrací souhlasíš s{' '}
              <Link href="/podminky" className="underline" style={{ color: '#E8634A' }}>podmínkami použití</Link>
              {' '}a{' '}
              <Link href="/ochrana-dat" className="underline" style={{ color: '#E8634A' }}>ochranou osobních údajů</Link>.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-[#F0EDE8] text-center">
            <p className="text-sm" style={{ color: '#8B6550' }}>
              Už máš účet?{' '}
              <Link href="/auth/login" className="font-bold no-underline hover:opacity-70" style={{ color: '#E8634A' }}>
                Přihlásit se
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6">
          <Link href="/" className="hover:opacity-70 no-underline" style={{ color: '#8B6550' }}>← Zpět na web</Link>
        </p>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 border-2 border-[#F0EDE8] rounded-xl text-sm outline-none focus:border-[#E8634A] transition-colors bg-white text-[#1A0F0A]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>{label}</label>
      {children}
    </div>
  )
}
