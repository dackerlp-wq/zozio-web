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

    // ✅ Klíčová oprava — full page reload aby server přečetl nové cookies
    const next = new URLSearchParams(window.location.search).get('next')
    window.location.href = next ?? '/admin/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFFCF8' }}>
      <div className="w-full max-w-[420px]">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
            <span className="text-sm font-semibold" style={{ color: '#8B6550' }}>zozio.cz</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-8">
          <h1 className="font-display font-extrabold text-2xl text-[#1A0F0A] mb-1">Přihlásit se</h1>
          <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
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
                className="text-xs font-semibold no-underline hover:opacity-70 mt-1 block text-right"
                style={{ color: '#E8634A' }}>
                Zapomněl/a jsem heslo
              </Link>
            </Field>

            {error && (
              <div className="text-sm font-semibold px-4 py-3 rounded-xl"
                style={{ background: '#FAECE7', color: '#993C1D' }}>
                ⚠️ {error}
              </div>
            )}

            <Button variant="primary" className="w-full justify-center" loading={loading} onClick={handleLogin}>
              Přihlásit se
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#F0EDE8] space-y-2 text-center">
            <p className="text-sm" style={{ color: '#8B6550' }}>
              Nemáš účet?{' '}
              <Link href="/auth/register" className="font-bold no-underline hover:opacity-70" style={{ color: '#E8634A' }}>
                Zaregistrovat se
              </Link>
            </p>
            <p className="text-sm" style={{ color: '#8B6550' }}>
              Registruješ útulek?{' '}
              <Link href="/auth/register?type=shelter" className="font-bold no-underline hover:opacity-70" style={{ color: '#E8634A' }}>
                Registrace instituce →
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#8B6550' }}>
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
