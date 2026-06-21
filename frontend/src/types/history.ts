export interface GenerationHistory {
  id: number
  title: string
  estimate: number
  notes: string
  created_at: string
  updated_at: string
  region_name: string
  region_state: string
  daily_kwh: number | string
  monthly_kwh: number | string
  yearly_kwh: number | string
  efficiency_index: number | string
  module_model: string | null
  module_manufacturer: string | null
  module_power_wp: number | string | null
}
