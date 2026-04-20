// Detekce českého kraje z GPS souřadnic
// Používá vzdálenost k centroidu každého kraje (dostatečně přesné pro reklamy)

const CZ_REGIONS = [
  { name: 'Hlavní město Praha',   lat: 50.0755, lng: 14.4378 },
  { name: 'Středočeský kraj',     lat: 49.97,   lng: 14.65   },
  { name: 'Jihočeský kraj',       lat: 49.05,   lng: 14.40   },
  { name: 'Plzeňský kraj',        lat: 49.73,   lng: 13.35   },
  { name: 'Karlovarský kraj',     lat: 50.22,   lng: 12.87   },
  { name: 'Ústecký kraj',         lat: 50.62,   lng: 13.85   },
  { name: 'Liberecký kraj',       lat: 50.73,   lng: 15.05   },
  { name: 'Královéhradecký kraj', lat: 50.37,   lng: 15.83   },
  { name: 'Pardubický kraj',      lat: 49.93,   lng: 15.97   },
  { name: 'Kraj Vysočina',        lat: 49.53,   lng: 15.57   },
  { name: 'Jihomoravský kraj',    lat: 49.10,   lng: 16.65   },
  { name: 'Olomoucký kraj',       lat: 49.65,   lng: 17.10   },
  { name: 'Zlínský kraj',         lat: 49.22,   lng: 17.68   },
  { name: 'Moravskoslezský kraj', lat: 49.73,   lng: 18.20   },
] as const

export type CzechRegion = typeof CZ_REGIONS[number]['name']

export const ALL_CZECH_REGIONS: CzechRegion[] = CZ_REGIONS.map(r => r.name)

/**
 * Vrátí název nejbližšího českého kraje pro dané GPS souřadnice.
 * Používá zjednodušenou euklidovskou vzdálenost (dostatečné pro ČR).
 */
export function regionFromCoords(lat: number, lng: number): CzechRegion {
  let nearest: typeof CZ_REGIONS[number] = CZ_REGIONS[0]
  let minDist = Infinity

  for (const region of CZ_REGIONS) {
    // Zjednodušená vzdálenost (nepoužíváme haversine — přesnost není kritická)
    const d = Math.sqrt(
      Math.pow(lat - region.lat, 2) +
      Math.pow((lng - region.lng) * Math.cos((lat * Math.PI) / 180), 2)
    )
    if (d < minDist) {
      minDist = d
      nearest = region
    }
  }

  return nearest.name
}

/**
 * Zkrácené zobrazení kraje pro UI (bez "kraj" na konci kde je redundantní)
 */
export function shortRegionName(name: CzechRegion): string {
  return name
    .replace('Hlavní město ', '')
    .replace(' kraj', '')
    .replace('Kraj ', '')
}
