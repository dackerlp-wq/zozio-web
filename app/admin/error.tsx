'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--coral-light)' }}
        >
          <span className="text-2xl">⚠️</span>
        </div>

        {/* Heading */}
        <h2
          className="font-display font-bold mb-2"
          style={{ fontSize: '20px', color: 'var(--espresso)' }}
        >
          Chyba při načítání
        </h2>

        <p className="text-text-muted text-sm mb-4 leading-relaxed">
          Při načítání obsahu nastala neočekávaná chyba. Zkus stránku obnovit.
        </p>

        {/* Dev error detail */}
        {isDev && error?.message && (
          <pre
            className="text-left text-xs rounded-lg p-3 mb-5 overflow-auto"
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
        <div className="flex gap-3 justify-center mt-5">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--coral)' }}
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    </div>
  )
}
