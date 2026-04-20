import Link from 'next/link'

interface LegalPageProps {
  title:    string
  updated:  string   // ISO date, e.g. "2026-04-19"
  children: React.ReactNode
}

/** Sdílený wrapper pro právní stránky (Podmínky, Ochrana dat) */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  const date = new Date(updated).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-20" style={{ background: '#FFFCF8' }}>
      <div className="max-w-[780px] mx-auto px-5 md:px-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-8 mt-6" style={{ color: '#8B6550' }}>
          <Link href="/" className="no-underline hover:underline" style={{ color: '#8B6550' }}>Zozio</Link>
          <span>›</span>
          <span>{title}</span>
        </nav>

        {/* Hlavička */}
        <div className="mb-10 pb-8 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3" style={{ color: '#2C1810' }}>
            {title}
          </h1>
          <p className="text-sm" style={{ color: '#8B6550' }}>
            Poslední aktualizace: <strong>{date}</strong>
          </p>
        </div>

        {/* Obsah */}
        <div className="legal-content space-y-8">
          {children}
        </div>

        {/* Footer linka */}
        <div className="mt-14 pt-8 border-t flex flex-wrap gap-4 text-sm" style={{ borderColor: '#F0EDE8', color: '#8B6550' }}>
          <Link href="/podminky"   className="no-underline hover:underline" style={{ color: '#8B6550' }}>Podmínky použití</Link>
          <Link href="/ochrana-dat" className="no-underline hover:underline" style={{ color: '#8B6550' }}>Ochrana osobních údajů</Link>
          <a href="mailto:team@zozio.cz" className="no-underline hover:underline" style={{ color: '#8B6550' }}>team@zozio.cz</a>
        </div>
      </div>

      <style>{`
        .legal-content h2 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.2rem;
          color: #2C1810;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid #F0EDE8;
        }
        .legal-content h3 {
          font-weight: 700;
          font-size: 0.95rem;
          color: #2C1810;
          margin-bottom: 0.4rem;
          margin-top: 1.2rem;
        }
        .legal-content p {
          font-size: 0.9rem;
          line-height: 1.75;
          color: #4A2E20;
          margin-bottom: 0.6rem;
        }
        .legal-content ul, .legal-content ol {
          padding-left: 1.4rem;
          margin-bottom: 0.6rem;
        }
        .legal-content li {
          font-size: 0.9rem;
          line-height: 1.7;
          color: #4A2E20;
          margin-bottom: 0.25rem;
        }
        .legal-content a {
          color: #E8634A;
          text-decoration: underline;
        }
        .legal-content strong {
          color: #2C1810;
          font-weight: 700;
        }
        .legal-content .highlight {
          background: #FAECE7;
          border-left: 3px solid #E8634A;
          padding: 0.75rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
          margin: 1rem 0;
        }
        .legal-content .highlight p {
          margin: 0;
        }
        .legal-content table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          margin: 1rem 0;
        }
        .legal-content th {
          text-align: left;
          padding: 0.5rem 0.75rem;
          font-weight: 700;
          color: #2C1810;
          background: #F5F2EE;
          border: 1px solid #F0EDE8;
        }
        .legal-content td {
          padding: 0.5rem 0.75rem;
          border: 1px solid #F0EDE8;
          color: #4A2E20;
          vertical-align: top;
        }
      `}</style>
    </main>
  )
}
