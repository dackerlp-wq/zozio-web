'use client'

export function PrintButton() {
  return (
    <>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border cursor-pointer transition-all hover:opacity-80"
        style={{ background: '#F0EDE8', color: '#6B4030', borderColor: '#E0DDD8' }}>
        🖨️ Tisk / PDF
      </button>

      <style>{`
        @media print {
          /* Skrýt sidebar a nav */
          aside, nav, header,
          [data-print="hide"],
          .no-print { display: none !important; }

          /* Rozbalit hlavní obsah přes celou šířku */
          main { margin-left: 0 !important; padding: 0 !important; }

          /* Bílé pozadí */
          body, main { background: white !important; }

          /* Karty bez stínu */
          .rounded-xl { box-shadow: none !important; border: 1px solid #E0DDD8 !important; }

          /* Tabulky — zalomit stránku před každou */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }

          /* Hlavička */
          @page { margin: 2cm; }
        }
      `}</style>
    </>
  )
}
