/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable remote persistence.'
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: false
  }
})
