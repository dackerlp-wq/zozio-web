// ══════════════════════════════════════════════
// Centralizované překlady stavů zvířat
// Importuj odkudkoliv — admin i veřejný web
// ══════════════════════════════════════════════

// Stav adopce (útulky) — adoption_status + odvozené zobrazovací stavy
export const ADOPTION_STATUS_LABEL: Record<string, string> = {
  intake:           'V příjmu',
  quarantine:       'Karanténa',       // odvozený stav (in_quarantine=true), není v DB
  available:        'K adopci',
  reserved:         'Rezervováno',
  adopted:          'Adoptováno',
  foster:           'Dočasná péče',
  treatment:        'V léčbě',
  deceased:         'Uhynul',
  not_for_adoption: 'Není k adopci',
  conditional:      'Podmíněná adopce',
}

export const ADOPTION_STATUS_BADGE: Record<string, string> = {
  intake:           'bg-[#E6F1FB] text-[#185FA5]',
  quarantine:       'bg-[#F0E6FB] text-[#6B35B5]',
  available:        'bg-success-bg text-success',
  reserved:         'bg-amber-light text-warning',
  adopted:          'bg-espresso text-white',
  foster:           'bg-[#EDE9FB] text-[#6D3BE8]',
  treatment:        'bg-[#FCEBEB] text-[#D83030]',
  deceased:         'bg-gray-pale text-gray',
  not_for_adoption: 'bg-gray-pale text-gray',
  conditional:      'bg-[#FFF0E6] text-[#C05000]',
}

export const ADOPTION_STATUS_ICON: Record<string, string> = {
  intake:           '📥',
  quarantine:       '🔒',
  available:        '🏠',
  reserved:         '📌',
  adopted:          '✅',
  foster:           '🏡',
  treatment:        '💊',
  deceased:         '🕊️',
  not_for_adoption: '⛔',
  conditional:      '🤝',
}

// Stav záchranného případu
export const RESCUE_STATUS_LABEL: Record<string, string> = {
  intake:      'Příjem',
  treatment:   'Léčba',
  released:    'Propuštěn do přírody',
  transferred: 'Přemístěn',
  deceased:    'Uhynul',
}

export const RESCUE_STATUS_BADGE: Record<string, string> = {
  intake:      'bg-coral-light text-coral-dark',
  treatment:   'bg-amber-light text-warning',
  released:    'bg-success-bg text-success',
  transferred: 'bg-sand text-brown-mid',
  deceased:    'bg-gray-pale text-gray',
}

export const RESCUE_STATUS_ICON: Record<string, string> = {
  intake:      '🚑',
  treatment:   '🩺',
  released:    '🌿',
  transferred: '🚐',
  deceased:    '💔',
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
  found:             'Nalezeno',
  surrendered:       'Odevzdáno majitelem',
  confiscated:       'Konfiskace',
  born_here:         'Narozeno v útulku',
  other:             'Jiný důvod',
  municipal_capture: 'Odchyceno obcí',
  seized:            'Odebráno (SVS/Policie)',
  transferred:       'Přemístěno z jiného útulku',
}

// Důvod nevhodnosti k adopci
export const NOT_FOR_ADOPTION_REASON_LABEL: Record<string, { icon: string; label: string; desc: string }> = {
  owner_unresolved:  { icon: '⚖️', label: 'Nevyřešený majitel',          desc: 'Probíhá hledání nebo spor o vlastnictví' },
  behavior:          { icon: '⚠️', label: 'Bezpečnostní riziko',         desc: 'Agresivita nebo nebezpečné chování' },
  legal:             { icon: '🔒', label: 'Právní blokace',              desc: 'Zabavení, soudní řízení nebo jiný právní důvod' },
  health:            { icon: '💊', label: 'Zdravotní nezpůsobilost',     desc: 'Vážné zdravotní důvody vylučující adopci' },
  protected_species: { icon: '🌿', label: 'Chráněný nebo exotický druh', desc: 'Ze zákona nelze nebo lze jen omezeně adoptovat' },
  other:             { icon: '📋', label: 'Jiný důvod',                  desc: 'Viz interní poznámky' },
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
