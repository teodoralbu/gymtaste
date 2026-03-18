'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Badge } from '@/components/ui/Badge'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function Navbar() {
  const { user, profile, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-sm" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'color-mix(in srgb, var(--bg) 95%, transparent)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="4" fill="#000000" />
            <polygon points="16,4 30,28 2,28" fill="#FFFFFF" />
            <polygon points="17,13 12,21 16,21 14,27 21,19 17,19" fill="#000000" />
          </svg>
          <span className="text-[17px] font-black tracking-wide hidden sm:block">
            GYM<span style={{ color: '#00B4FF' }}>TASTE</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1 ml-2">
          <Link href="/browse" className="text-sm text-[#666] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1E1E1E] transition-colors">
            Browse
          </Link>
          <Link href="/leaderboard" className="text-sm text-[#666] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1E1E1E] transition-colors">
            Top Rated
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side icons */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Search icon */}
          <Link
            href="/browse"
            aria-label="Search"
            className="sm:hidden min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-[#1E1E1E] transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>

          {/* Notifications bell — mobile only */}
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="sm:hidden min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-[#1E1E1E] transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Link>

          {/* Auth area */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[#1E1E1E] animate-pulse" />
          ) : user && profile ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 py-1 px-2 rounded-lg min-h-11 hover:bg-[#1E1E1E] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] overflow-hidden flex items-center justify-center text-sm font-bold text-[#00B4FF] flex-shrink-0">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.username?.[0]?.toUpperCase() ?? '?'
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">{profile.username}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', zIndex: 60 }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-sm font-semibold truncate">{profile.username}</p>
                    <div className="mt-1.5">
                      <Badge tier={profile.badge_tier} size="sm" />
                    </div>
                  </div>
                  {[
                    { href: `/users/${profile.username}`, label: 'Profile' },
                    { href: '/notifications', label: 'Notifications' },
                    { href: '/leaderboard', label: 'Leaderboard' },
                    { href: '/submit', label: 'Submit product' },
                    { href: '/settings', label: 'Settings' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-muted)' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-[#A0A0A0] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1E1E1E] transition-colors hidden sm:block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-[#00B4FF] text-[#0A0A0A] hover:bg-[#33C4FF] transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
