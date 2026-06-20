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
