'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme, Theme } from '@/context/theme-context'

const THEMES: { key: Theme; label: string; description: string; dot: string; dotBorder?: string }[] = [
  { key: 'blue',  label: 'Blue',  description: 'Dark navy',   dot: '#3D8EFF' },
  { key: 'light', label: 'Light', description: 'Clean white', dot: '#F8F9FC', dotBorder: '#DDE3EF' },
  { key: 'black', label: 'Black', description: 'Pure black',  dot: '#111111', dotBorder: '#444444' },
]

const ICONS: Record<Theme, React.ReactNode> = {
  blue: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" fill="currentColor" opacity="0.15" />
      <circle cx="8" cy="8" r="3.5" fill="currentColor" />
    </svg>
  ),
  light: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line key={deg} x1="8" y1="2" x2="8" y2="4"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          transform={`rotate(${deg} 8 8)`} />
      ))}
    </svg>
  ),
  black: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" fill="currentColor" />
      <circle cx="9.5" cy="6.5" r="4" fill="var(--bg)" />
    </svg>
  ),
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          backgroundColor: open ? 'var(--bg-hover)' : 'var(--bg-elevated)',
          color: open ? 'var(--text)' : 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (open) return
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text)'
        }}
        onMouseLeave={(e) => {
          if (open) return
          e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
          e.currentTarget.style.color = 'var(--text-muted)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px', lineHeight: 1 }}>🎨</span>
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          padding: '6px',
          minWidth: '140px',
          zIndex: 100,
          animation: 'fadeUp 0.15s ease forwards',
        }}>
          {THEMES.map(({ key, label, description, dot, dotBorder }) => {
            const active = theme === key
            return (
              <button
                key={key}
                onClick={() => { setTheme(key); setOpen(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: dot,
                  border: dotBorder ? `1px solid ${dotBorder}` : 'none',
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1 }}>
                  <span style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    lineHeight: 1.2,
                  }}>{label}</span>
                  <span style={{
                    display: 'block',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    marginTop: '1px',
                  }}>{description}</span>
                </span>
                {active && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 6l2.5 2.5L10 3.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
