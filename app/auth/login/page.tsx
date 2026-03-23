'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Vyplň e-mail a heslo')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Nesprávný e-mail nebo heslo')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-warm flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
            <span className="text-sm text-gray font-semibold">zozio.cz</span>
          </Link>
        </div>

        {/* Karta */}
        <div className="bg-white rounded-lg shadow-md border border-gray-pale p-8">
          <h1 className="font-display font-extrabold text-3xl text-espresso mb-1">
            Přihlásit se
          </h1>
          <p className="text-sm text-gray mb-6 font-semibold">
            Admin panel pro útulky a záchranné stanice
          </p>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brown uppercase tracking-wider">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="vas@email.cz"
                className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-brown uppercase tracking-wider">
                  Heslo
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-coral hover:text-coral-dark transition-colors font-semibold">
                  Zapomněl/a jsem heslo
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors"
              />
            </div>

            {error && (
              <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm">
                ⚠️ {error}
              </div>
            )}

            <Button
              variant="primary"
              className="w-full justify-center"
              loading={loading}
              onClick={handleLogin}
            >
              Přihlásit se
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-pale text-center">
            <p className="text-sm text-gray">
              Ještě nemáš účet?{' '}
              <Link href="/auth/register" className="text-coral font-bold hover:text-coral-dark transition-colors">
                Zaregistrovat instituci
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray mt-6">
          <Link href="/" className="hover:text-coral transition-colors">← Zpět na web</Link>
        </p>
      </div>
    </div>
  )
}
