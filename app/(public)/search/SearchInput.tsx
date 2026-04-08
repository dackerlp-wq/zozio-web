'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export function SearchInput({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  useEffect(() => { setValue(defaultValue) }, [defaultValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2" role="search">
      <label htmlFor="search-input" className="sr-only">Hledat na Zozio</label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Hledej zvíře, útulok, město..."
        autoFocus
        className="flex-1 px-5 py-4 border-2 border-gray-pale rounded-sm font-body text-base text-espresso outline-none focus:border-coral transition-colors bg-white"
      />
      <button
        type="submit"
        aria-label="Hledat"
        className="px-6 py-4 bg-coral text-white font-display font-bold rounded-sm hover:bg-coral-dark transition-colors cursor-pointer border-none"
      >
        🔍
      </button>
    </form>
  )
}
