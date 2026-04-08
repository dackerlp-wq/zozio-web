'use client'

import { FavoriteButton } from './FavoriteButton'

interface Props {
  id: string
  type: 'animal' | 'institution'
  size?: 'sm' | 'md'
  className?: string
}

// Wrapper který zastaví propagaci kliknutí (např. uvnitř <Link>)
export function FavoriteButtonWrapper({ id, type, size, className }: Props) {
  return (
    <div
      onClick={e => { e.preventDefault(); e.stopPropagation() }}
      className={className}
    >
      <FavoriteButton type={type} id={id} size={size} />
    </div>
  )
}
