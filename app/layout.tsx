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
  title: 'Kuchli va Zamonaviy Veb-Sayt',
  description: 'Professional va kengaytiriladigan veb-sayt platformasi',
  keywords: ['website', 'platform', 'modern', 'powerful'],
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  }
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
        {/* Global yorug'lik effekti - butun saytga */}
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle at 50% 20%, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.04) 40%, transparent 70%)',
            animation: 'pulse 3s ease-in-out infinite',
          }}
        />
        <Providers>
          <TelegramWebApp />
          <VisitorTracker />
          <div className="min-h-screen flex flex-col relative z-10">
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
