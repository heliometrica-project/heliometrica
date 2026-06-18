const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const TOKEN_KEY = 'heliometrica_token'

interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, string>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }
    return url.toString()
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params)
    const token = this.getToken()
    const init: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    }
    if (body !== undefined) {
      init.body = JSON.stringify(body)
    }
    const response = await fetch(url, init)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      let message = `${response.status} ${response.statusText}`
      if (errorBody) {
        if (typeof errorBody.detail === 'string') {
          message = errorBody.detail
        } else if (typeof errorBody === 'object') {
          const fieldErrors = Object.entries(errorBody)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ')
          if (fieldErrors) message = fieldErrors
        }
      }
      throw new Error(message)
    }

    return response.json()
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options)
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options)
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options)
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options)
  }
}

export const apiClient = new ApiClient(BASE_URL)
export { ApiClient }
