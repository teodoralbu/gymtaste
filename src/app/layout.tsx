import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})
import { AuthProvider } from '@/context/auth-context'
import { ThemeProvider } from '@/context/theme-context'
import { ToastProvider } from '@/context/ToastContext'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageTransition } from '@/components/layout/PageTransition'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 1,
  themeColor: '#080B12',
}

export const metadata: Metadata = {
  title: 'GYMTASTE — Rate it before you waste it.',
  description:
    "GYMTASTE is where lifters rate supplement flavors — so you don't blow $40 on something undrinkable.",
  openGraph: {
    title: 'GYMTASTE',
    description: 'Rate it before you waste it.',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GymTaste',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="blue" className={inter.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Prevent flash of wrong theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('gt-theme');var valid=['blue','light','black'];if(!valid.includes(t))t='blue';document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <PageTransition>
                <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))] sm:pb-0">
                  {children}
                </main>
              </PageTransition>
              <div className="hidden sm:block">
                <Footer />
              </div>
              <BottomNav />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
