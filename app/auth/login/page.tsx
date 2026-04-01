'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email || !password) { setError('Vyplň e-mail a heslo'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.session) {
      setError('Nesprávný e-mail nebo heslo')
      setLoading(false)
      return
    }

    // full page reload aby server přečetl nové cookies
    const next = new URLSearchParams(window.location.search).get('next')
    window.location.href = next ?? '/admin/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-warm">
      <div className="w-full max-w-[420px]">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
            <span className="text-sm font-semibold text-text-muted">zozio.cz</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <h1 className="font-display font-extrabold text-2xl text-text-primary mb-1">Přihlásit se</h1>
          <p className="text-sm mb-6 text-text-muted">
            Pro útulky, záchranné stanice i návštěvníky
          </p>

          <div className="space-y-4">
            <Field label="E-mail">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="vas@email.cz" className={inputCls} />
            </Field>
            <Field label="Heslo">
              <div className="relative">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••" className={inputCls} />
              </div>
              <Link href="/auth/forgot-password"
                className="text-xs font-semibold no-underline hover:opacity-70 mt-1 block text-right text-coral">
                Zapomněl/a jsem heslo
              </Link>
            </Field>

            {error && (
              <div className="text-sm font-semibold px-4 py-3 rounded-xl bg-coral-tag-bg text-coral-tag-text">
                ⚠️ {error}
              </div>
            )}

            <Button variant="primary" className="w-full justify-center" loading={loading} onClick={handleLogin}>
              Přihlásit se
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-2 text-center">
            <p className="text-sm text-text-muted">
              Nemáš účet?{' '}
              <Link href="/auth/register" className="font-bold no-underline hover:opacity-70 text-coral">
                Zaregistrovat se
              </Link>
            </p>
            <p className="text-sm text-text-muted">
              Registruješ útulek?{' '}
              <Link href="/auth/register?type=shelter" className="font-bold no-underline hover:opacity-70 text-coral">
                Registrace instituce →
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6 text-text-muted">
          <Link href="/" className="hover:opacity-70 no-underline text-text-muted">← Zpět na web</Link>
        </p>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 border-2 border-border rounded-xl text-sm outline-none focus:border-coral transition-colors bg-white text-text-primary'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</label>
      {children}
    </div>
  )
}
