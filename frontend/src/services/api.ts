import type { AiStatus, CreateReadingPayload, Reading } from '../types/reading'

const API_BASE = '/api'

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json() as { error?: string; message?: string }
      message = body.error || body.message || message
    } catch { /* response did not contain JSON */ }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function getReadings(): Promise<Reading[]> {
  return parseResponse<Reading[]>(await fetch(`${API_BASE}/readings`))
}

export async function getReading(id: string): Promise<Reading> {
  return parseResponse<Reading>(await fetch(`${API_BASE}/readings/${encodeURIComponent(id)}`))
}

export async function createReading(payload: CreateReadingPayload): Promise<Reading> {
  return parseResponse<Reading>(await fetch(`${API_BASE}/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
}

export async function deleteReading(id: string): Promise<void> {
  await parseResponse<void>(await fetch(`${API_BASE}/readings/${encodeURIComponent(id)}`, { method: 'DELETE' }))
}

export async function getAiStatus(): Promise<AiStatus> {
  return parseResponse<AiStatus>(await fetch(`${API_BASE}/ai/status`))
}

export async function getHealth(): Promise<unknown> {
  return parseResponse<unknown>(await fetch(`${API_BASE}/health`))
}
