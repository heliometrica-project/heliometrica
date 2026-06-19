export interface SolarModule {
  id: number
  model: string
  manufacturer: string
  power_wp: number
  efficiency: number
  area_m2: number
  quantity: number
  created_at: string
}

export interface SolarModuleFormData {
  model: string
  manufacturer: string
  power_wp: number | ''
  efficiency: number | ''
  area_m2: number | ''
  quantity: number | ''
}
