'use client'

interface InstitutionMapProps {
  lat:       number
  lng:       number
  name:      string
  city:      string
  className?: string
}

export function InstitutionMap({ lat, lng, name, city, className = '' }: InstitutionMapProps) {
  // Mapy.cz embed — funguje v ČR bez API klíče
  const mapyCzUrl = `https://frame.mapy.cz/zakladni?x=${lng}&y=${lat}&z=15&source=coor&id=${lng}%2C${lat}`

  // Google Maps odkaz pro "Jak se dostat"
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  return (
    <div className={className}>
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm h-[180px] md:h-[240px]">
        <iframe
          src={mapyCzUrl}
          width="100%"
          height="100%"
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
