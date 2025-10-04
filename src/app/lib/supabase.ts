import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Use env vars from `.env.local`
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabaseClient: SupabaseClient<Database> | null = null

export const createClient = (): SupabaseClient<Database> => {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}