'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, SupabaseClient } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  // Initialize Supabase client on mount
  useEffect(() => {
    const client = createClient()
    setSupabase(client)
  }, [])

  // Handle auth state when client is ready
  useEffect(() => {
    if (!supabase) {
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setAuthState({
        user: data.session?.user ?? null,
        session: data.session,
        loading: false,
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: new Error('Supabase not initialized') }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    },
    [supabase]
  )

  const signOut = useCallback(async () => {
    if (!supabase) return { error: new Error('Supabase not initialized') }
    const { error } = await supabase.auth.signOut()
    return { error }
  }, [supabase])

  const getToken = useCallback(async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [supabase])

  return {
    ...authState,
    signIn,
    signOut,
    getToken,
    isAuthenticated: !!authState.session,
  }
}
