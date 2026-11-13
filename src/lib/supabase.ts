import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function isValidSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.hostname === 'localhost'
  } catch {
    return false
  }
}

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.'
    : !isValidSupabaseUrl(supabaseUrl)
      ? 'VITE_SUPABASE_URL must be a valid HTTPS Supabase URL (HTTP is allowed only on localhost).'
      : null

export const supabase = supabaseConfigError
  ? null
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
