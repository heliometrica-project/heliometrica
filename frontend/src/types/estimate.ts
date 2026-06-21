export interface EnergyEstimate {
  id: number
  daily_kwh: number | string
  monthly_kwh: number | string
  annual_kwh: number | string
  efficiency_index: number | string
}
