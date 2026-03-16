'use client'

import { useTheme } from '@/context/theme-context'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
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
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
