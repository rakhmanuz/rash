import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Providers } from './providers'
import VisitorTracker from '@/components/VisitorTracker'
import { TelegramWebApp } from '@/components/TelegramWebApp'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'RASH - Kuchli va Zamonaviy Veb-Sayt',
  description: 'Professional va kengaytiriladigan veb-sayt platformasi',
  keywords: ['website', 'platform', 'modern', 'powerful'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" dir="ltr" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/telegram-manifest.json" />
      </head>
      <body className={inter.className}>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Providers>
          <TelegramWebApp />
          <VisitorTracker />
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
