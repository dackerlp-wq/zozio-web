import type { Metadata } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import { NavbarWrapper, FooterWrapper } from '@/components/admin/NavbarWrapper'
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

export const metadata: Metadata = {
  title: 'Zozio — Zachraňme zvířata',
  description: 'Platforma pro útulky a záchranné stanice v ČR a SR. Lidé volají SOS — zvířata volají ZOZ.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="font-body bg-warm text-espresso antialiased">
        <NavbarWrapper />
        {children}
        <FooterWrapper />
      </body>
    </html>
  )
}
