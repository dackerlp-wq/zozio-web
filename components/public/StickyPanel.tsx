'use client'
import { useEffect, useRef, useState } from 'react'

interface StickyPanelProps {
  children: React.ReactNode
}

export function StickyPanel({ children }: StickyPanelProps) {
  const panelRef  = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(96) // výchozí offset pod navbarem

  useEffect(() => {
    // Dynamicky nastav top offset pod navbarem
    const nav = document.querySelector('nav')
    if (nav) setTop(nav.offsetHeight + 16)
  }, [])

  return (
    <div
      ref={panelRef}
      className="bg-white rounded-2xl border border-border overflow-hidden"
      style={{
        position: 'sticky',
        top:      top,
        maxHeight: `calc(100vh - ${top + 32}px)`,
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  )
}
