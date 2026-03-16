import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-anon-key'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Only use real values if they look valid — prevents crashes when env vars are placeholder text
  const safeUrl = url?.startsWith('https://') ? url : PLACEHOLDER_URL
  const safeKey = key?.startsWith('eyJ') ? key : PLACEHOLDER_KEY
  return createBrowserClient<Database>(safeUrl, safeKey)
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url?.startsWith('https://') && key?.startsWith('eyJ'))
}
