import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return null client during build time when env vars aren't available
  if (!supabaseUrl || !supabaseKey) {
    // During build, return a mock that won't be used
    if (typeof window === 'undefined') {
      return null as any
    }
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}

