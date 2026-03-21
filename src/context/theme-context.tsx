'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'blue' | 'light' | 'black'

const CYCLE: Theme[] = ['blue', 'light', 'black']
const STORAGE_KEY = 'gt-theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  cycle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'blue',
  setTheme: () => {},
  cycle: () => {},
})

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('blue')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initial = saved && CYCLE.includes(saved) ? saved : 'blue'
    setThemeState(initial)
    applyTheme(initial)
  }, [])

  function setTheme(next: Theme) {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  function cycle() {
    const idx = CYCLE.indexOf(theme)
    setTheme(CYCLE[(idx + 1) % CYCLE.length])
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
