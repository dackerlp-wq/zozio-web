'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ZozLogo } from '@/components/ui/ZozLogo'
import { Button } from '@/components/ui/Button'

const inputCls = 'w-full px-4 py-3 border-2 border-[#F0EDE8] rounded-xl text-sm outline-none focus:border-[#E8634A] transition-colors bg-white text-[#1A0F0A]'

function ResetForm() {
  const searchParams = useSearchParams()
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [done,      setDone]      = useState(false)

  // Supabase při resetu hesla posílá token jako URL hash fragment (#access_token=...)
  // exchangeCodeForSession je pro PKCE, ale pro password reset funguje jinak:
  // browser client automaticky zpracuje hash fragment při inicializaci
  useEffect(() => {
    // Nic speciálního — Supabase browser client hash zpracuje sám
  }, [])

  const handleReset = async () => {
    if (!password)              { setError('Zadej nové heslo'); return }
    if (password.length < 8)    { setError('Heslo musí mít alespoň 8 znaků'); return }
    if (password !== password2) { setError('Hesla se neshodují'); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message.includes('Auth session missing')
        ? 'Odkaz pro reset hesla je neplatný nebo vypršel. Požádej o nový.'
        : updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-display font-extrabold text-xl text-[#1A0F0A] mb-2">Heslo bylo změněno</h2>
        <p className="text-sm mb-6" style={{ color: '#8B6550' }}>Nové heslo je aktivní. Můžeš se přihlásit.</p>
        <Link href="/auth/login"
          className="inline-flex px-5 py-2.5 rounded-[100px] text-sm font-bold text-white no-underline"
          style={{ background: '#E8634A' }}>
          Přihlásit se →
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-display font-extrabold text-2xl text-[#1A0F0A] mb-1">Nové heslo</h1>
      <p className="text-sm mb-6" style={{ color: '#8B6550' }}>Zadej nové heslo pro svůj účet.</p>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>
            Nové heslo *
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="min. 8 znaků"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8B6550' }}>
            Potvrdit heslo *
          </label>
          <input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReset()}
            placeholder="zopakuj heslo"
            className={inputCls}
          />
        </div>

        {error && (
          <div className="text-sm font-semibold px-4 py-3 rounded-xl"
            style={{ background: '#FAECE7', color: '#993C1D' }}>
            ⚠️ {error}
          </div>
        )}

        <Button variant="primary" className="w-full justify-center" loading={loading} onClick={handleReset}>
          Nastavit nové heslo
        </Button>
      </div>

      <div className="mt-6 text-center">
        <Link href="/auth/login" className="text-sm font-semibold hover:opacity-70 no-underline"
          style={{ color: '#8B6550' }}>
          ← Zpět na přihlášení
        </Link>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#FFFCF8' }}>
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] p-8">
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: '#E8634A', borderTopColor: 'transparent' }} />
            </div>
          }>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
