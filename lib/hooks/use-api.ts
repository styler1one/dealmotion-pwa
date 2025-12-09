'use client'

import { useState } from 'react'
import useSWR, { SWRConfiguration } from 'swr'
import { useAuth } from './use-auth'
import { api } from '../api'

export function useApi<T>(
  endpoint: string | null,
  options?: SWRConfiguration
) {
  const { getToken, isAuthenticated, loading: authLoading } = useAuth()

  const fetcher = async (url: string) => {
    const token = await getToken()
    
    if (!token) {
      console.warn('[useApi] No token available for:', url)
      throw new Error('Not authenticated')
    }
    
    console.log('[useApi] Fetching:', url)
    
    try {
      const result = await api<T>(url, { token })
      console.log('[useApi] Success:', url, result)
      return result
    } catch (error) {
      console.error('[useApi] Error:', url, error)
      throw error
    }
  }

  // Only start fetching when auth is loaded AND user is authenticated
  const shouldFetch = !authLoading && isAuthenticated && endpoint

  const { data, error, isLoading, mutate } = useSWR<T>(
    shouldFetch ? endpoint : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      ...options,
    }
  )

  return {
    data,
    error,
    // Show loading if auth is still loading OR if SWR is loading
    isLoading: authLoading || isLoading,
    mutate,
  }
}

export function useApiMutation<T, B extends Record<string, unknown> = Record<string, unknown>>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST'
) {
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (body?: B): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const result = await api<T>(endpoint, {
        method,
        body,
        token,
      })

      return result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { mutate, isLoading, error }
}
