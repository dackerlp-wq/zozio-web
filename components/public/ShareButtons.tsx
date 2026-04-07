'use client'
import { useState, useEffect } from 'react'

interface ShareButtonsProps {
  url:   string
  title: string
  text:  string
}

export function ShareButtons({ url, title, text }: ShareButtonsProps) {
  const [canShare, setCanShare] = useState(false)
  const [copied,   setCopied]   = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator)
  }, [])

  const encoded     = encodeURIComponent(url)
  const encodedText = encodeURIComponent(`${title} — ${text}`)

  const handleShare = async () => {
    try { await navigator.share({ title, text, url }) } catch {}
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => {})
  }

  const btn = 'inline-flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 no-underline transition-opacity hover:opacity-80 cursor-pointer border-none'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0" style={{ color: '#8B6550' }}>Sdílet:</span>

      {/* Facebook */}
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank" rel="noopener noreferrer"
        aria-label="Sdílet na Facebook"
        className={btn} style={{ background: '#1877F2' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      </a>

      {/* WhatsApp */}
      <a href={`https://wa.me/?text=${encodedText}%20${encoded}`}
        target="_blank" rel="noopener noreferrer"
        aria-label="Sdílet na WhatsApp"
        className={btn} style={{ background: '#25D366' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </a>

      {/* Telegram */}
      <a href={`https://t.me/share/url?url=${encoded}&text=${encodedText}`}
        target="_blank" rel="noopener noreferrer"
        aria-label="Sdílet na Telegram"
        className={btn} style={{ background: '#0088CC' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
        </svg>
      </a>

      {/* X / Twitter */}
      <a href={`https://x.com/intent/tweet?url=${encoded}&text=${encodedText}`}
        target="_blank" rel="noopener noreferrer"
        aria-label="Sdílet na X"
        className={btn} style={{ background: '#000' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>

      {/* Kopírovat odkaz */}
      <button onClick={handleCopy}
        aria-label="Kopírovat odkaz"
        className={btn}
        style={{ background: copied ? '#EAF3DE' : '#F0EDE8' }}>
        {copied
          ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B4030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        }
      </button>

      {/* Native share — pouze na mobilech pokud je podporováno */}
      {canShare && (
        <button onClick={handleShare}
          aria-label="Sdílet"
          className={btn} style={{ background: '#1A0F0A' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      )}
    </div>
  )
}
