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
  title: 'rash.uz - Ta\'lim Platformasi',
  description: 'Kuchli va zamonaviy ta\'lim platformasi. O\'quvchilar, o\'qituvchilar va adminlar uchun professional boshqaruv tizimi.',
  keywords: ['ta\'lim', 'education', 'platform', 'rash.uz', 'o\'quvchilar', 'o\'qituvchilar'],
  authors: [{ name: 'rash.uz' }],
  creator: 'rash.uz',
  publisher: 'rash.uz',
  metadataBase: new URL('https://rash.uz'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    url: 'https://rash.uz',
    siteName: 'rash.uz',
    title: 'rash.uz - Ta\'lim Platformasi',
    description: 'Kuchli va zamonaviy ta\'lim platformasi',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'rash.uz - Ta\'lim Platformasi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'rash.uz - Ta\'lim Platformasi',
    description: 'Kuchli va zamonaviy ta\'lim platformasi',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#22c55e',
  colorScheme: 'dark',
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/icon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="rash.uz" />
        <meta property="og:image" content="https://rash.uz/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="https://rash.uz/og-image.png" />
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
