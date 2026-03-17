'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

export function BottomNav() {
  const pathname = usePathname()
  const { profile } = useAuth()

  const profileHref = profile?.username ? `/users/${profile.username}` : '/login'

  const homeActive    = pathname === '/'
  const browseActive  = pathname.startsWith('/browse') || pathname.startsWith('/products') || pathname.startsWith('/flavors') || pathname.startsWith('/brands')
  const rateActive    = pathname.startsWith('/rate')
  const topActive     = pathname.startsWith('/leaderboard')
  const profileActive = pathname.startsWith('/users') || pathname.startsWith('/settings') || pathname === '/login' || pathname === '/signup'

  const tabStyle = (active: boolean) => ({
    flex: 1,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '4px',
    padding: '10px 0 8px',
    minHeight: '64px',
    color: active ? 'var(--accent)' : 'var(--text-faint)',
    textDecoration: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation' as const,
    userSelect: 'none' as const,
    position: 'relative' as const,
  })

  const labelStyle = (active: boolean) => ({
    fontSize: '10px',
    fontWeight: active ? 700 : 500,
    lineHeight: 1,
    letterSpacing: '0.02em',
  })

  return (
    <nav
      className="sm:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        display: 'flex',
        alignItems: 'stretch',
        /* Allow the floating Rate button to overflow above */
        overflow: 'visible',
      }}
    >
      {/* Home */}
      <Link href="/" style={tabStyle(homeActive)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={homeActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span style={labelStyle(homeActive)}>Home</span>
        {homeActive && <span style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '2px', borderRadius: '999px', backgroundColor: 'var(--accent)' }} />}
      </Link>

      {/* Browse */}
      <Link href="/browse" style={tabStyle(browseActive)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={browseActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span style={labelStyle(browseActive)}>Browse</span>
        {browseActive && <span style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '2px', borderRadius: '999px', backgroundColor: 'var(--accent)' }} />}
      </Link>

      {/* Rate — floating center action */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' }}>
        <Link
          href="/rate"
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: rateActive ? 'color-mix(in srgb, var(--accent) 90%, #000)' : 'var(--accent)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            boxShadow: `0 4px 16px color-mix(in srgb, var(--accent) 50%, transparent), 0 2px 6px rgba(0,0,0,0.4)`,
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            zIndex: 10,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(0.93)' }}
          onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(1)' }}
          onTouchStart={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(0.93)' }}
          onTouchEnd={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(1)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
        {/* Invisible spacer to keep flex layout */}
        <span style={{ fontSize: '10px', color: 'transparent', marginTop: 'auto', paddingBottom: '8px', fontWeight: 700 }}>Rate</span>
      </div>

      {/* Top Rated */}
      <Link href="/leaderboard" style={tabStyle(topActive)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={topActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 20 18 10" />
          <polyline points="12 20 12 4" />
          <polyline points="6 20 6 14" />
        </svg>
        <span style={labelStyle(topActive)}>Top</span>
        {topActive && <span style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '2px', borderRadius: '999px', backgroundColor: 'var(--accent)' }} />}
      </Link>

      {/* Profile */}
      <Link href={profileHref} style={tabStyle(profileActive)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={profileActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span style={labelStyle(profileActive)}>Profile</span>
        {profileActive && <span style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '2px', borderRadius: '999px', backgroundColor: 'var(--accent)' }} />}
      </Link>
    </nav>
  )
}
