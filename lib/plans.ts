import type { SubscriptionPlan } from '@/types/database'

// ─── Konstanty ───────────────────────────────────────────────────────────────

export const FREE_ANIMALS_LIMIT = 20

export const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  free:     'Free',
  standard: 'Standard',
  pro:      'Pro',
}

export const PLAN_PRICES: Record<SubscriptionPlan, string> = {
  free:     'Zdarma',
  standard: '490 Kč / měsíc',
  pro:      '990 Kč / měsíc',
}

export const PLAN_EMOJI: Record<SubscriptionPlan, string> = {
  free:     '🐾',
  standard: '⭐',
  pro:      '🚀',
}

// ─── Typy funkcí ─────────────────────────────────────────────────────────────

export type PlanFeature =
  | 'unlimited_animals'
  | 'email_notifications'
  | 'fundraisers'
  | 'volunteers'
  | 'newsletter'
  | 'export_csv'
  | 'advanced_stats'
  | 'widget'
  | 'branches'
  | 'priority_listing'
  | 'advanced_reports'
  | 'onboarding'
  | 'priority_support'

// ─── Co který plán zahrnuje ───────────────────────────────────────────────────

const PLAN_FEATURES: Record<SubscriptionPlan, Set<PlanFeature>> = {
  free: new Set([]),
  standard: new Set([
    'unlimited_animals',
    'email_notifications',
    'fundraisers',
    'volunteers',
    'newsletter',
    'export_csv',
    'advanced_stats',
    'widget',
  ]),
  pro: new Set([
    'unlimited_animals',
    'email_notifications',
    'fundraisers',
    'volunteers',
    'newsletter',
    'export_csv',
    'advanced_stats',
    'widget',
    'branches',
    'priority_listing',
    'advanced_reports',
    'priority_support',
  ]),
}

// ─── České popisky funkcí (pro UpgradePrompt) ────────────────────────────────

export const FEATURE_LABELS: Record<PlanFeature, string> = {
  unlimited_animals:    'Neomezená zvířata',
  email_notifications:  'E-mail notifikace',
  fundraisers:          'Sbírky (fundraising)',
  volunteers:           'Správa dobrovolníků',
  newsletter:           'Newsletter pro odběratele',
  export_csv:           'Export CSV',
  advanced_stats:       'Pokročilé statistiky',
  widget:               'Embed widget pro web',
  branches:             'Správa poboček',
  priority_listing:     'Prioritní zobrazení',
  advanced_reports:     'Pokročilé reporty',
  onboarding:           'Onboarding asistence',
  priority_support:     'Prioritní podpora (SLA)',
}

// Minimální plán, který danou funkci odemkne
export const FEATURE_MIN_PLAN: Record<PlanFeature, SubscriptionPlan> = {
  unlimited_animals:    'standard',
  email_notifications:  'standard',
  fundraisers:          'standard',
  volunteers:           'standard',
  newsletter:           'standard',
  export_csv:           'standard',
  advanced_stats:       'standard',
  widget:               'standard',
  branches:             'pro',
  priority_listing:     'pro',
  advanced_reports:     'pro',
  onboarding:           'pro',
  priority_support:     'pro',
}

// ─── Utility funkce ───────────────────────────────────────────────────────────

/**
 * Vrátí true pokud má plán platné předplatné (free je vždy platné).
 */
export function isPlanActive(plan: SubscriptionPlan, planExpiresAt: string | null): boolean {
  if (plan === 'free') return true
  if (!planExpiresAt) return false
  return new Date(planExpiresAt) > new Date()
}

/**
 * Vrátí efektivní plán — pokud vypršelo, degraduje na free.
 */
export function effectivePlan(plan: SubscriptionPlan, planExpiresAt: string | null): SubscriptionPlan {
  return isPlanActive(plan, planExpiresAt) ? plan : 'free'
}

/**
 * Vrátí true pokud má instituce přístup k dané funkci.
 */
export function hasFeature(
  plan: SubscriptionPlan,
  planExpiresAt: string | null,
  feature: PlanFeature
): boolean {
  const ep = effectivePlan(plan, planExpiresAt)
  return PLAN_FEATURES[ep].has(feature)
}

/**
 * Vrátí true pokud může instituce přidat další zvíře.
 * Free: max FREE_ANIMALS_LIMIT aktivních zvířat; Standard+: neomezeno.
 */
export function canAddAnimal(
  plan: SubscriptionPlan,
  planExpiresAt: string | null,
  activeCount: number
): boolean {
  const ep = effectivePlan(plan, planExpiresAt)
  if (ep === 'free') return activeCount < FREE_ANIMALS_LIMIT
  return true
}

/**
 * Vrátí seznam všech funkcí dostupných v daném plánu.
 */
export function planFeatureList(plan: SubscriptionPlan): PlanFeature[] {
  return [...PLAN_FEATURES[plan]]
}
