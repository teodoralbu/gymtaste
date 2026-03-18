'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/lib/types'

interface AuthContextValue {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await db.from('users').select('*').eq('id', userId).single()
      if (data) setProfile(data as User)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase]
  )

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) await fetchProfile(user.id)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Non-blocking: profile may already be set by signIn pre-fetch
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    // Pre-fetch profile so it's ready before the page navigates
    if (!error && data.user) await fetchProfile(data.user.id)
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()
    if (existing) return { error: 'Username already taken.' }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }

    if (data.user) {
      const { error: profileError } = await db.from('users').insert({
        id: data.user.id,
        username,
        email,
        badge_tier: 'fresh_meat',
      })
      if (profileError) return { error: profileError.message }
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
