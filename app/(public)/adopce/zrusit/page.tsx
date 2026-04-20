'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ZozLogo } from '@/components/ui/ZozLogo'

function CancelForm() {
  const searchParams = useSearchParams()
  const id    = searchParams.get('id')
  const token = searchParams.get('token')

  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  const handleCancel = async () => {
    if (!id || !token) return
    setState('loading')
    try {
      const res = await fetch(`/api/applications/${id}/cancel?token=${encodeURIComponent(token)}`, {
        method: 'POST',
      })
      if (res.ok) {
        setState('done')
      } else {
        const data = await res.json()
        setErrMsg(data.error ?? 'Chyba při rušení žádosti.')
        setState('error')
      }
    } catch {
      setErrMsg('Nepodařilo se připojit k serveru.')
      setState('error')
    }
  }

  if (!id || !token) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="font-display font-extrabold text-xl mb-2" style={{ color: '#1A0F0A' }}>Neplatný odkaz</h2>
        <p className="text-sm mb-6" style={{ color: '#8B6550' }}>Odkaz pro zrušení žádosti je neplatný nebo vypršel.</p>
        <Link href="/" className="inline-flex px-5 py-2.5 rounded-[100px] text-sm font-bold text-white no-underline"
          style={{ background: '#E8634A' }}>
          Zpět na Zozio
        </Link>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-display font-extrabold text-xl mb-2" style={{ color: '#1A0F0A' }}>Žádost byla zrušena</h2>
        <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
          Vaše žádost o adopci byla úspěšně zrušena. Pokud jste se rozmysleli, můžete podat novou.
        </p>
        <Link href="/adopt" className="inline-flex px-5 py-2.5 rounded-[100px] text-sm font-bold text-white no-underline"
          style={{ background: '#E8634A' }}>
          Hledat zvíře →
        </Link>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="font-display font-extrabold text-2xl mb-2" style={{ color: '#1A0F0A' }}>
          Zrušit žádost o adopci?
        </h2>
        <p className="text-sm" style={{ color: '#8B6550' }}>
          Tuto akci nelze vrátit zpět. Žádost bude označena jako stornovaná.
        </p>
      </div>

      {state === 'error' && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: '#FAECE7', color: '#993C1D' }}>
          ⚠️ {errMsg}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={handleCancel}
          disabled={state === 'loading'}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none transition-opacity disabled:opacity-60"
          style={{ background: '#993C1D' }}
        >
          {state === 'loading' ? 'Ruší se…' : '🚫 Ano, zrušit žádost'}
        </button>
        <Link href="/"
          className="w-full py-3.5 rounded-xl font-bold text-sm text-center no-underline cursor-pointer transition-opacity"
          style={{ background: '#F5F0EC', color: '#6B4030' }}>
          Ne, zpět na web
        </Link>
      </div>
    </div>
  )
}

export default function ZrušitŽádostPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#FFFCF8' }}>
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
            <ZozLogo size="lg" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: '#F0EDE8' }}>
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: '#E8634A', borderTopColor: 'transparent' }} />
            </div>
          }>
            <CancelForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
