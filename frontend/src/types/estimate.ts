export interface WeatherSnapshot {
  id: number
  region: number
  region_name: string
  region_state: string
  date: string
  irradiation: string | null
  temperature: string | null
  cloud_cover: string | null
  source: string
  status: string
  created_at: string
  is_fallback: boolean
  fallback_message: string | null
  warning?: string
}

export interface EstimatePayload {
  region_id: number
  module_id: number
}

export interface CustomEstimatePayload {
  module_id: number
  name: string
  state: string
  latitude: number
  longitude: number
}

export interface EstimateResult {
  id: number
  daily_kwh: string
  monthly_kwh: string
  annual_kwh: string
  efficiency_index: string
}

export interface HistoryPayload {
  title: string
  estimate: number
  notes?: string
}

export interface HistoryRecord {
  id: number
  title: string
  estimate: number
  notes: string
  created_at: string
  updated_at: string
}
