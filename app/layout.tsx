import type { Metadata, Viewport } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import { NavbarWrapper, FooterWrapper } from '@/components/public/NavbarWrapper'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const baloo = Baloo_2({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zozio.cz'

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default:  'Zozio — Najdi svého nového přítele',
    template: '%s | Zozio',
  },
  description: 'Adoptuj zvíře z útulku nebo podpoř záchrannou stanici. Stovky zvířat čekají na nový domov po celé ČR a SR.',
  keywords:    ['útulok', 'adopce psa', 'adopce kočky', 'záchranná stanice', 'zvířata k adopci', 'Czech'],
  authors:     [{ name: 'Zozio' }],
  creator:     'Zozio',
  openGraph: {
    type:        'website',
    locale:      'cs_CZ',
    url:         BASE,
    siteName:    'Zozio',
    title:       'Zozio — Najdi svého nového přítele',
    description: 'Adoptuj zvíře z útulku nebo podpoř záchrannou stanici. Stovky zvířat čekají na nový domov.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Zozio — Zachraňme zvířata' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Zozio — Najdi svého nového přítele',
    description: 'Adoptuj zvíře z útulku nebo podpoř záchrannou stanici.',
    images:      ['/og-image.jpg'],
  },
  robots: {
    index:           true,
    follow:          true,
    googleBot: {
      index:              true,
      follow:             true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor:   '#E8634A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="font-body bg-warm text-espresso antialiased">
        <a href="#main-content" className="skip-link">Přejít na obsah</a>
        <NavbarWrapper />
        {children}
        <FooterWrapper />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
