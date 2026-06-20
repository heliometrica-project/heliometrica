export interface RegionSeries {
  region_id: number
  region_name: string
  region_state: string
  estimates_count: number
  daily_kwh: string | null
  monthly_kwh: string | null
  yearly_kwh: string | null
  efficiency_index: string | null
}

export interface ChartDataset {
  key: string
  label: string
  data: (number | null)[]
}

export interface CompareChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface CompareResponse {
  metric: string
  region_ids: number[]
  series: RegionSeries[]
  chart: CompareChartData
}

export interface CustomLocation {
  id: number
  name: string
  state: string
  latitude: number
  longitude: number
}

export interface CustomLocationSeries {
  location_id: number
  location_name: string
  location_state: string
  daily_kwh: string
  monthly_kwh: string
  yearly_kwh: string
  irradiation: string
  temperature: string
}

export interface CustomCompareResponse {
  metric: string
  locations: { id: number; name: string; state: string }[]
  series: CustomLocationSeries[]
  chart: CompareChartData
}
