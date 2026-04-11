/**
 * Formats breed display string.
 * - "Mops"                     → is_crossbreed=false
 * - "Mops/kříženec"            → is_crossbreed=true, no breed2
 * - "Mops × Labrador"          → is_crossbreed=true, breed2 set
 */
export function formatBreed(
  breed?: string | null,
  isCrossbreed?: boolean,
  breed2?: string | null,
): string {
  if (!breed) return ''
  if (!isCrossbreed) return breed
  if (breed2?.trim()) return `${breed} × ${breed2}`
  return `${breed}/kříženec`
}
