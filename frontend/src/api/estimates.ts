import { apiClient } from './client'
import type {
  CustomEstimatePayload,
  EstimatePayload,
  EstimateResult,
  HistoryPayload,
  HistoryRecord,
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
