'use client'

interface ShareButtonsProps {
  url:   string
  title: string
  text:  string
}

export function ShareButtons({ url, title, text }: ShareButtonsProps) {
  const encoded     = encodeURIComponent(url)
  const encodedText = encodeURIComponent(`${title} — ${text}`)

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {}
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <span className="text-xs font-bold text-gray uppercase tracking-wider self-center">Sdílet:</span>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] text-white text-xs font-bold rounded-pill hover:opacity-90 transition-opacity no-underline"
      >
        Facebook
      </a>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodedText}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-pill hover:opacity-90 transition-opacity no-underline"
      >
        WhatsApp
      </a>

      {/* Kopírovat odkaz */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(url)
            .then(() => alert('Odkaz zkopírován!'))
            .catch(() => {})
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand text-brown text-xs font-bold rounded-pill hover:bg-gray-pale transition-colors cursor-pointer border-none"
      >
        🔗 Kopírovat odkaz
      </button>

      {/* Native share (mobile) */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          onClick={share}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-espresso text-white text-xs font-bold rounded-pill hover:bg-brown transition-colors cursor-pointer border-none"
        >
          ↗ Sdílet
        </button>
      )}
    </div>
  )
}
