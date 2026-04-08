'use client'

interface InstitutionMapProps {
  lat:  number
  lng:  number
  name: string
  city: string
}

export function InstitutionMap({ lat, lng, name, city }: InstitutionMapProps) {
  // Mapy.cz embed — funguje v ČR bez API klíče
  const mapyCzUrl = `https://frame.mapy.cz/zakladni?x=${lng}&y=${lat}&z=15&source=coor&id=${lng}%2C${lat}`

  // Google Maps odkaz pro "Jak se dostat"
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  return (
    <div className="mt-4">
      <div className="rounded-lg overflow-hidden border border-gray-pale shadow-sm">
        <iframe
          src={mapyCzUrl}
          width="100%"
          height="220"
          style={{ border: 'none', display: 'block' }}
          title={`Mapa — ${name}`}
          loading="lazy"
          allowFullScreen
        />
      </div>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-2 text-xs font-bold text-coral hover:text-coral-dark transition-colors no-underline"
      >
        🗺️ Navigovat v Google Maps
      </a>
    </div>
  )
}
