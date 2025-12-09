const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dealmotion.ai'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: Record<string, unknown>
  headers?: Record<string, string>
  token?: string
}

interface ApiError {
  message: string
  status: number
}

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error: ApiError = {
      message: `API error: ${response.statusText}`,
      status: response.status,
    }

    try {
      const errorData = await response.json()
      error.message = errorData.detail || errorData.message || error.message
    } catch {
      // Use default error message
    }

    throw error
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}

// Convenience methods
export const apiGet = <T>(endpoint: string, token?: string) =>
  api<T>(endpoint, { method: 'GET', token })

export const apiPost = <T>(endpoint: string, body: Record<string, unknown>, token?: string) =>
  api<T>(endpoint, { method: 'POST', body, token })

export const apiPut = <T>(endpoint: string, body: Record<string, unknown>, token?: string) =>
  api<T>(endpoint, { method: 'PUT', body, token })

export const apiDelete = <T>(endpoint: string, token?: string) =>
  api<T>(endpoint, { method: 'DELETE', token })

