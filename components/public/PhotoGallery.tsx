'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface PhotoGalleryProps {
  photos: string[]
  primaryPhoto?: string | null
  animalName: string
  icon?: string | null
}

export function PhotoGallery({ photos, primaryPhoto, animalName, icon }: PhotoGalleryProps) {
  const allPhotos = primaryPhoto
    ? [primaryPhoto, ...photos.filter(p => p !== primaryPhoto)]
    : photos

  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const prev = useCallback(() => setActive(i => (i - 1 + allPhotos.length) % allPhotos.length), [allPhotos.length])
  const next = useCallback(() => setActive(i => (i + 1) % allPhotos.length), [allPhotos.length])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     setLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  if (allPhotos.length === 0) {
    return (
      <div className="w-full h-[280px] md:h-[420px] rounded-lg bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-[100px]">
        {icon ?? '🐾'}
      </div>
    )
  }

  return (
    <>
      {/* Hlavní foto */}
      <div
        className="relative w-full h-[280px] md:h-[420px] rounded-lg overflow-hidden cursor-zoom-in mb-3"
        onClick={() => setLightbox(true)}
      >
        <Image
          src={allPhotos[active]}
          alt={`${animalName} — foto ${active + 1}`}
          fill
          className="object-cover hover:scale-[1.02] transition-transform duration-300"
          priority
        />
        {allPhotos.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer border-none text-espresso font-bold text-sm"
            >
              ‹
            </button>
            <button
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer border-none text-espresso font-bold text-sm"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setActive(i) }}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer border-none ${i === active ? 'bg-white scale-125' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-pill">
          🔍 Zvětšit
        </div>
      </div>

      {/* Thumbnaily */}
      {allPhotos.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allPhotos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-transparent p-0
                ${i === active ? 'border-coral scale-[1.05]' : 'border-transparent hover:border-coral/50'}`}
            >
              <Image src={photo} alt={`${animalName} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Zavřít */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl cursor-pointer border-none transition-all"
          >
            ×
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-semibold">
            {active + 1} / {allPhotos.length}
          </div>

          {/* Foto */}
          <div
            className="relative w-full max-w-[90vw] max-h-[85vh] aspect-auto flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={allPhotos[active]}
              alt={`${animalName} — foto ${active + 1}`}
              width={1200}
              height={800}
              className="object-contain max-h-[85vh] w-auto rounded-lg"
            />
          </div>

          {/* Navigace */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl cursor-pointer border-none transition-all"
              >
                ‹
              </button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl cursor-pointer border-none transition-all"
              >
                ›
              </button>

              {/* Thumbnaily v lightboxu */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-1">
                {allPhotos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setActive(i) }}
                    className={`relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 bg-transparent p-0
                      ${i === active ? 'border-coral' : 'border-white/20 hover:border-white/50'}`}
                  >
                    <Image src={photo} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
