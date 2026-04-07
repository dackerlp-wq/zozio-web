'use client'
import { useState, useEffect } from 'react'

interface ShareButtonsProps {
  url:   string
  title: string
  text:  string
}

export function ShareButtons({ url, title, text }: ShareButtonsProps) {
  const [canShare, setCanShare] = useState(false)

  // Detekuj navigator.share až po mountu — vyhne se hydration mismatch
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator)
  }, [])

  const encoded     = encodeURIComponent(url)
  const encodedText = encodeURIComponent(`${title} — ${text}`)

  const handleShare = async () => {
    try {
      await navigator.share({ title, text, url })
    } catch {}
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
      .then(() => alert('Odkaz zkopírován!'))
      .catch(() => {})
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0" style={{ color: '#8B6550' }}>Sdílet:</span>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-white no-underline hover:opacity-90 transition-opacity flex-shrink-0"
        style={{ background: '#1877F2' }}
      >
        Facebook
      </a>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodedText}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-white no-underline hover:opacity-90 transition-opacity flex-shrink-0"
        style={{ background: '#25D366' }}
      >
        WhatsApp
      </a>

      {/* Kopírovat odkaz */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none hover:opacity-80 transition-opacity flex-shrink-0"
        style={{ background: '#F0EDE8', color: '#6B4030' }}
      >
        🔗 Kopírovat
      </button>

      {/* Native share — pouze po mountu pokud je podporováno */}
      {canShare && (
        <button
          onClick={handleShare}
          className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer border-none hover:opacity-90 transition-opacity flex-shrink-0"
          style={{ background: '#1A0F0A' }}
        >
          ↗ Sdílet
        </button>
      )}
    </div>
  )
}
