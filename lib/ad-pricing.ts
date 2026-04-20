/**
 * Zozio Ads — centrální výpočet ceny kampaně
 *
 * Tato funkce je JEDINÝ zdroj pravdy pro cenu reklamy.
 * Používá se v: PortalAdForm (live kalkulace), detail reklamy, dashboard, info stránka.
 */

import type { AdSlotType } from '@/types/database'

// ── Ceny bez DPH v Kč / měsíc (newsletter = za jedno vydání) ─────────────
export const SLOT_PRICES: Record<AdSlotType, number> = {
  inline_grid:   1_490,
  sidebar:       1_990,
  banner_adopt:  2_990,
  banner_home:   3_490,
  banner_animal: 1_990,
  newsletter:    1_490,
}

export const SLOT_LABELS: Record<AdSlotType, string> = {
  inline_grid:   'Inline grid',
  sidebar:       'Sidebar',
  banner_adopt:  'Banner adopce',
  banner_home:   'Banner homepage',
  banner_animal: 'Banner zvíře',
  newsletter:    'Newsletter',
}

// ── Pravidla slev ────────────────────────────────────────────────────────────
// Délka kampaně (počítá se jen pro non-newsletter sloty)
export const DURATION_DISCOUNTS = [
  { minDays: 90, pct: 20 },
  { minDays: 60, pct: 10 },
] as const

// Regionální cílení (menší dosah = nižší cena)
// 0 krajů = celá ČR = žádná sleva
export const REGION_DISCOUNTS = [
  { maxRegions: 5,  pct: 25 },
  { maxRegions: 13, pct: 10 },
] as const

// Maximální kombinovaná sleva
export const MAX_COMBINED_DISCOUNT_PCT = 35

export const VAT_RATE = 0.21

// ── Typy ─────────────────────────────────────────────────────────────────────

export interface PricingLine {
  slot:          AdSlotType
  label:         string
  /** Základní cena bez slev a DPH */
  basePrice:     number
  isNewsletter:  boolean
  /** Počet dní (0 pro newsletter) */
  durationDays:  number
}

export interface PricingResult {
  lines:                PricingLine[]
  durationDays:         number        // délka kampaně (pro non-newsletter sloty)

  // Slevy
  durationDiscountPct:  number
  regionDiscountPct:    number
  totalDiscountPct:     number        // = min(duration + region, MAX_COMBINED_DISCOUNT_PCT)

  // Částky bez DPH
  subtotal:             number        // součet basePrice před slevou
  discountAmount:       number        // odečtená sleva
  afterDiscount:        number        // subtotal - discountAmount

  // DPH a finál
  vat:                  number
  total:                number        // afterDiscount + vat (zaokrouhleno na Kč)

  // Pomocné
  regionCount:          number        // počet vybraných krajů (0 = celá ČR)
  isNational:           boolean
}

// ── Hlavní výpočetní funkce ───────────────────────────────────────────────────

export interface PricingInput {
  slots:          AdSlotType[]
  active_from:    string          // YYYY-MM-DD
  active_to:      string          // YYYY-MM-DD
  target_regions: string[]        // [] = celá ČR
}

export function calcPricing(input: PricingInput): PricingResult {
  const { slots, active_from, active_to, target_regions } = input

  // Délka kampaně v dnech (rozdíl datumů; 30 dní = 1 měsíc = plná měsíční cena)
  const durationDays = active_from && active_to
    ? Math.max(0, Math.round(
        (new Date(active_to).getTime() - new Date(active_from).getTime())
        / (1000 * 60 * 60 * 24)
      ))
    : 0

  // Jednotlivé řádky kalkulace
  const lines: PricingLine[] = slots.map(slot => {
    const isNewsletter = slot === 'newsletter'
    const monthlyPrice = SLOT_PRICES[slot] ?? 0
    // Newsletter: vždy 1× cena za vydání, ostatní: poměrná část z měsíční ceny
    const basePrice = isNewsletter
      ? monthlyPrice
      : Math.round((monthlyPrice / 30) * durationDays)
    return {
      slot,
      label: SLOT_LABELS[slot] ?? slot,
      basePrice,
      isNewsletter,
      durationDays: isNewsletter ? 0 : durationDays,
    }
  })

  const subtotal = lines.reduce((s, l) => s + l.basePrice, 0)

  // Sleva za délku (platí pro celý nákup pokud je alespoň 1 non-newsletter slot)
  const hasNonNewsletter = slots.some(s => s !== 'newsletter')
  const durationDiscountPct = hasNonNewsletter
    ? (DURATION_DISCOUNTS.find(d => durationDays >= d.minDays)?.pct ?? 0)
    : 0

  // Sleva za regionální cílení
  const regionCount = target_regions.length
  const isNational  = regionCount === 0
  const regionDiscountPct = isNational
    ? 0
    : (REGION_DISCOUNTS.find(r => regionCount <= r.maxRegions)?.pct ?? 0)

  // Kombinovaná sleva (cap)
  const totalDiscountPct  = Math.min(durationDiscountPct + regionDiscountPct, MAX_COMBINED_DISCOUNT_PCT)
  const discountAmount    = Math.round(subtotal * totalDiscountPct / 100)
  const afterDiscount     = subtotal - discountAmount
  const vat               = Math.round(afterDiscount * VAT_RATE)
  const total             = afterDiscount + vat

  return {
    lines,
    durationDays,
    durationDiscountPct,
    regionDiscountPct,
    totalDiscountPct,
    subtotal,
    discountAmount,
    afterDiscount,
    vat,
    total,
    regionCount,
    isNational,
  }
}

/**
 * Zkrácená verze — vrátí jen `total` (vč. DPH, vč. všech slev).
 * Vhodná pro dashboard tabulky a přehledy.
 */
export function calcAdTotal(ad: {
  slots: AdSlotType[]
  active_from: string
  active_to: string
  target_regions?: string[]
}): number {
  return calcPricing({
    slots:          ad.slots,
    active_from:    ad.active_from,
    active_to:      ad.active_to,
    target_regions: ad.target_regions ?? [],
  }).total
}
