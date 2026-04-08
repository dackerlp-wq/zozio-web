/** Generate URL slug from Czech breed name */
export function breedSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Find breed by slug (case/diacritics insensitive) */
export function matchesSlug(name: string, slug: string): boolean {
  return breedSlug(name) === slug
}
