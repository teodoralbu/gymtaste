import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/auth-context'
import { ThemeProvider } from '@/context/theme-context'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageTransition } from '@/components/layout/PageTransition'

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
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0D0F14" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <ThemeProvider>
          <AuthProvider>
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
