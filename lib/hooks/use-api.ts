'use client'

import { useState } from 'react'
import useSWR, { SWRConfiguration } from 'swr'
import { useAuth } from './use-auth'
import { api } from '../api'

export function useApi<T>(
  endpoint: string | null,
  options?: SWRConfiguration
) {
  const { getToken, isAuthenticated } = useAuth()

  const fetcher = async (url: string) => {
    const token = await getToken()
    if (!token) throw new Error('Not authenticated')
    return api<T>(url, { token })
  }

  const { data, error, isLoading, mutate } = useSWR<T>(
    isAuthenticated && endpoint ? endpoint : null,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    }
  )

  return {
    data,
    error,
    isLoading,
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

