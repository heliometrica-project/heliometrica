import { apiClient } from './client'
import type { CompareResponse, CustomCompareResponse, CustomLocation } from '../types'

export interface ComparePayload {
  region_ids: number[]
}

export async function compareRegions(payload: ComparePayload): Promise<CompareResponse> {
  return apiClient.post<CompareResponse>('/estimates/compare/', payload)
}

export interface CustomComparePayload {
  locations: CustomLocation[]
}

export async function compareCustom(payload: CustomComparePayload): Promise<CustomCompareResponse> {
  return apiClient.post<CustomCompareResponse>('/estimates/compare/custom/', payload)
}
