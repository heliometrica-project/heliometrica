import { apiClient } from './client'
import type {
  CustomEstimatePayload,
  EstimatePayload,
  EstimateResult,
  HistoryPayload,
  HistoryRecord,
  HistoryUpdatePayload,
  WeatherSnapshot,
} from '../types'

export async function getWeather(regionId: number): Promise<WeatherSnapshot> {
  return apiClient.get<WeatherSnapshot>('/weather/', {
    params: { region_id: String(regionId) },
  })
}

export async function createEstimate(payload: EstimatePayload): Promise<EstimateResult> {
  return apiClient.post<EstimateResult>('/estimates/', payload)
}

export async function createCustomEstimate(
  payload: CustomEstimatePayload
): Promise<EstimateResult> {
  return apiClient.post<EstimateResult>('/estimates/custom/', payload)
}

export async function saveHistory(payload: HistoryPayload): Promise<HistoryRecord> {
  return apiClient.post<HistoryRecord>('/history/', payload)
}

export async function listHistory(): Promise<HistoryRecord[]> {
  return apiClient.get<HistoryRecord[]>('/history/')
}

export async function updateHistory(id: number, payload: HistoryUpdatePayload): Promise<HistoryRecord> {
  return apiClient.patch<HistoryRecord>(`/history/${id}/`, payload)
}

export async function deleteHistory(id: number): Promise<void> {
  return apiClient.delete<void>(`/history/${id}/`)
}

export async function exportHistoryCsv(id: number): Promise<Blob> {
  const token = localStorage.getItem('heliometrica_token')
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/history/${id}/export/`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )
  if (!response.ok) throw new Error('Erro ao exportar CSV')
  return response.blob()
}
