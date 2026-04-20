'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (!email) { setError('Zadej e-mail'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) { setError('Nepodařilo se odeslat e-mail'); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-warm flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-pale p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h1 className="font-display font-extrabold text-2xl text-espresso mb-2">
                E-mail odeslán!
              </h1>
              <p className="text-sm text-gray mb-6">
                Zkontroluj svou schránku a klikni na odkaz pro reset hesla.
              </p>
              <Link href="/auth/login">
                <Button variant="primary" className="w-full justify-center">
                  Zpět na přihlášení
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display font-extrabold text-3xl text-espresso mb-1">
                Zapomenuté heslo
              </h1>
              <p className="text-sm text-gray mb-6 font-semibold">
                Pošleme ti odkaz pro reset hesla.
              </p>

              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-xs font-bold text-brown uppercase tracking-wider">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  placeholder="vas@email.cz"
                  className="px-4 py-3 border-2 border-gray-pale rounded-sm font-body text-sm outline-none focus:border-coral transition-colors"
                />
              </div>

              {error && (
                <div className="bg-coral-light text-coral-dark text-sm font-semibold px-4 py-3 rounded-sm mb-4">
                  ⚠️ {error}
                </div>
              )}

              <Button variant="primary" className="w-full justify-center" loading={loading} onClick={handleReset}>
                Odeslat odkaz
              </Button>

              <div className="mt-4 text-center">
                <Link href="/auth/login" className="text-sm text-gray hover:text-coral transition-colors font-semibold">
                  ← Zpět na přihlášení
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
