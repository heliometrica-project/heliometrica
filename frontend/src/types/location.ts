export interface SelectedLocation {
  name: string
  state: string
  latitude: number
  longitude: number
  source: 'region' | 'osm'
}
