import { apiClient } from './client'
import type { CompareResponse } from '../types'

export interface ComparePayload {
  region_ids: number[]
}

export async function compareRegions(payload: ComparePayload): Promise<CompareResponse> {
  return apiClient.post<CompareResponse>('/estimates/compare/', payload)
}
