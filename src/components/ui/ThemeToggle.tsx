'use client'

import { useTheme, Theme } from '@/context/theme-context'

const THEME_META: Record<Theme, { label: string; icon: React.ReactNode; next: string }> = {
  blue: {
    label: 'Blue',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" fill="currentColor" opacity="0.15" />
        <circle cx="8" cy="8" r="3.5" fill="currentColor" />
      </svg>
    ),
    next: 'Light',
  },
  light: {
    label: 'Light',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="8" y1="2" x2="8" y2="4"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            transform={`rotate(${deg} 8 8)`}
          />
        ))}
      </svg>
    ),
    next: 'Black',
  },
  black: {
    label: 'Black',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" fill="currentColor" />
        <circle cx="9.5" cy="6.5" r="4" fill="var(--bg)" />
      </svg>
    ),
    next: 'Blue',
  },
}

export function ThemeToggle() {
  const { theme, cycle } = useTheme()
  const meta = THEME_META[theme]

  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${meta.label}. Switch to ${meta.next}`}
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
        e.currentTarget.style.color = 'var(--text)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
        e.currentTarget.style.color = 'var(--text-muted)'
      }}
    >
      {meta.icon}
    </button>
  )
}
