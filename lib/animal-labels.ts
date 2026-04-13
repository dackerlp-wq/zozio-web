// ══════════════════════════════════════════════
// Centralizované překlady stavů zvířat
// Importuj odkudkoliv — admin i veřejný web
// ══════════════════════════════════════════════

// Stav adopce (útulky)
export const ADOPTION_STATUS_LABEL: Record<string, string> = {
  available:       'K adopci',
  reserved:        'Rezervováno',
  adopted:         'Adoptováno',
  foster:          'Ve foster péči',
  not_for_adoption: 'Není k adopci',
}

export const ADOPTION_STATUS_BADGE: Record<string, string> = {
  available:        'bg-success-bg text-success',
  reserved:         'bg-amber-light text-warning',
  adopted:          'bg-espresso text-white',
  foster:           'bg-rescue-bg text-rescue-dark',
  not_for_adoption: 'bg-gray-pale text-gray',
}

export const ADOPTION_STATUS_ICON: Record<string, string> = {
  available:        '✓',
  reserved:         '⏳',
  adopted:          '🏠',
  foster:           '👨‍👩‍👧',
  not_for_adoption: '⛔',
}

// Stav záchranného případu
export const RESCUE_STATUS_LABEL: Record<string, string> = {
  intake:         'Příjem',
  treatment:      'Léčba',
  rehabilitation: 'Rehabilitace',
  released:       'Propuštěn do přírody',
  transferred:    'Přemístěn',
  deceased:       'Uhynul',
}

export const RESCUE_STATUS_BADGE: Record<string, string> = {
  intake:         'bg-coral-light text-coral-dark',
  treatment:      'bg-amber-light text-warning',
  rehabilitation: 'bg-rescue-bg text-rescue-dark',
  released:       'bg-success-bg text-success',
  transferred:    'bg-sand text-brown-mid',
  deceased:       'bg-gray-pale text-gray',
}

export const RESCUE_STATUS_ICON: Record<string, string> = {
  intake:         '🚑',
  treatment:      '🩺',
  rehabilitation: '💪',
  released:       '🌿',
  transferred:    '🚐',
  deceased:       '💔',
}

// Zdravotní stav
export const HEALTH_STATUS_LABEL: Record<string, string> = {
  healthy:    'Zdravý',
  sick:       'Nemocný',
  injured:    'Zraněný',
  recovering: 'Rekonvalescence',
  chronic:    'Chronické onemocnění',
}

export const HEALTH_STATUS_BADGE: Record<string, string> = {
  healthy:    'bg-success-bg text-success',
  sick:       'bg-coral-light text-coral-dark',
  injured:    'bg-coral-light text-coral-dark',
  recovering: 'bg-amber-light text-warning',
  chronic:    'bg-rescue-bg text-rescue-dark',
}

// Původ zvířete — hodnoty sloupce `origin` v DB
export const ORIGIN_LABEL: Record<string, string> = {
  found:             'Nalezeno nálezcem',
  municipal_capture: 'Odchyceno obcí',
  surrendered:       'Odevzdáno majitelem',
  seized:            'Odebráno (SVS/Policie)',
  transferred:       'Přemístěno z jiného útulku',
  other:             'Jiné',
}

// Důvod příjmu — hodnoty sloupce `intake_reason` v DB
export const INTAKE_REASON_LABEL: Record<string, string> = {
  // původní hodnoty (text pole)
  found:             'Nalezeno',
  surrendered:       'Odevzdáno majitelem',
  confiscated:       'Konfiskace',
  born_here:         'Narozeno v útulku',
  other:             'Jiný důvod',
  // fallback — pokud intake_reason obsahuje origin klíč
  municipal_capture: 'Odchyceno obcí',
  seized:            'Odebráno (SVS/Policie)',
  transferred:       'Přemístěno z jiného útulku',
}

// Pohlaví
export const SEX_LABEL: Record<string, string> = {
  male:    '♂ Samec',
  female:  '♀ Samice',
  unknown: 'Neznámé',
}

// Velikost
export const SIZE_LABEL: Record<string, string> = {
  small:  'Malý',
  medium: 'Střední',
  large:  'Velký',
  xlarge: 'Extra velký',
}
