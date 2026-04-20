'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PublicError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16 bg-warm flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-5 text-center">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--coral-light)' }}
        >
          <span className="text-3xl">🐾</span>
        </div>

        {/* Heading */}
        <h1
          className="font-display font-extrabold mb-3"
          style={{ fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--espresso)' }}
        >
          Něco se pokazilo
        </h1>

        <p className="text-text-muted text-base mb-4 leading-relaxed">
          Při načítání stránky nastala chyba. Zkus to prosím znovu, nebo se vrať na hlavní stránku.
        </p>

        {/* Dev error detail */}
        {isDev && error?.message && (
          <pre
            className="text-left text-xs rounded-lg p-4 mb-6 overflow-auto"
            style={{
              background: 'var(--coral-light)',
              color: 'var(--coral-dark)',
              border: '1px solid var(--coral)',
            }}
          >
            {error.message}
          </pre>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full font-semibold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--coral)' }}
          >
            Zkusit znovu
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-full font-semibold text-sm transition-colors no-underline"
            style={{
              background: 'var(--coral-light)',
              color: 'var(--coral-dark)',
            }}
          >
            Zpět na hlavní stránku
          </Link>
        </div>
      </div>
    </main>
  )
}
