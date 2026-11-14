import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Canonical Supabase Project for Russian Market (deeprhlnoflqzpraxkaq)
const DEFAULT_SUPABASE_URL = 'https://deeprhlnoflqzpraxkaq.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_sZDP51eyY5koRcQ8t4l5hg_TXT8sSy-'

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL
)?.trim() ?? ''

const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY
)?.trim() ?? ''

function isValidSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.hostname === 'localhost'
  } catch {
    return false
  }
}

export const supabaseConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.'
    : !isValidSupabaseUrl(supabaseUrl)
      ? 'VITE_SUPABASE_URL must be a valid HTTPS Supabase URL (HTTP is allowed only on localhost).'
      : null

export const supabase = supabaseConfigError
  ? null
  : createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
