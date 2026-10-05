export class ApiError extends Error {
  status: number
  errors?: Record<string, string>

  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    credentials: 'same-origin',
  })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    errors?: Record<string, string>
  }
  if (!res.ok) {
    throw new ApiError(data.error || 'Une erreur est survenue.', res.status, data.errors)
  }
  return data as T
}
