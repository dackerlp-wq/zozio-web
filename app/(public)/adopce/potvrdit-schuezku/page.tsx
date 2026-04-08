'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ZozLogo } from '@/components/ui/ZozLogo'

function ConfirmForm() {
  const searchParams = useSearchParams()
  const id      = searchParams.get('id')
  const token   = searchParams.get('token')
  const option  = searchParams.get('option')

  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [confirmedDate, setConfirmedDate] = useState('')
  const [errMsg, setErrMsg] = useState('')

  const handleConfirm = async () => {
    if (!id || !token || option === null) return
    setState('loading')
    try {
      const res = await fetch(`/api/applications/${id}/confirm-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, optionIndex: Number(option) }),
      })
      const data = await res.json()
      if (res.ok) {
        setConfirmedDate(data.confirmedDate ?? '')
        setState('done')
      } else {
        setErrMsg(data.error ?? 'Chyba při potvrzování termínu.')
        setState('error')
      }
    } catch {
      setErrMsg('Nepodařilo se připojit k serveru.')
      setState('error')
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('cs-CZ', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  if (!id || !token || option === null) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="font-display font-extrabold text-xl mb-2" style={{ color: '#1A0F0A' }}>Neplatný odkaz</h2>
        <p className="text-sm mb-6" style={{ color: '#8B6550' }}>Odkaz pro potvrzení schůzky je neplatný nebo vypršel.</p>
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
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-display font-extrabold text-xl mb-2" style={{ color: '#1A0F0A' }}>Termín potvrzen!</h2>
        {confirmedDate && (
          <div className="mb-4 px-4 py-3 rounded-xl font-semibold text-sm"
            style={{ background: '#FAECE7', color: '#993C1D' }}>
            📅 {formatDate(confirmedDate)}
          </div>
        )}
        <p className="text-sm mb-6" style={{ color: '#8B6550' }}>
          Útulek byl informován o vašem potvrzení. Těšíme se na setkání!
        </p>
        <Link href="/profil?tab=applications"
          className="inline-flex px-5 py-2.5 rounded-[100px] text-sm font-bold text-white no-underline"
          style={{ background: '#E8634A' }}>
          Zobrazit mé žádosti →
        </Link>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📅</div>
        <h2 className="font-display font-extrabold text-2xl mb-2" style={{ color: '#1A0F0A' }}>
          Potvrdit termín schůzky
        </h2>
        <p className="text-sm" style={{ color: '#8B6550' }}>
          Potvrdíte útulek informujeme, že vám termín vyhovuje.
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
          onClick={handleConfirm}
          disabled={state === 'loading'}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none transition-opacity disabled:opacity-60"
          style={{ background: '#E8634A' }}
        >
          {state === 'loading' ? 'Potvrzuji…' : '✅ Ano, tento termín mi vyhovuje'}
        </button>
        <Link href="/"
          className="w-full py-3.5 rounded-xl font-bold text-sm text-center no-underline cursor-pointer transition-opacity"
          style={{ background: '#F5F0EC', color: '#6B4030' }}>
          Zpět na web
        </Link>
      </div>
    </div>
  )
}

export default function PotvrditSchůzkuPage() {
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
            <ConfirmForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
