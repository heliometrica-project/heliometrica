import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api'
import { reverseGeocode, parseResult } from '../api/nominatim'
import type { Region, SelectedLocation } from '../types'
import { Sidebar } from '../components/Sidebar'
import { InteractiveMap } from '../components/InteractiveMap'
import { RegionDetailCard } from '../components/RegionDetailCard'
import { ChartPlaceholder } from '../components/ChartPlaceholder'
import './Dashboard.css'

export function Dashboard() {
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  void regions

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiClient.get<Region[]>('/regions/')
      .then((data) => setRegions(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar regiões'))
      .finally(() => setLoading(false))
  }, [])

  const selectLocation = useCallback(
    (loc: { name: string; state: string; lat: number; lng: number }) => {
      setSelectedLocation({
        name: loc.name,
        state: loc.state,
        latitude: loc.lat,
        longitude: loc.lng,
        source: 'osm',
      })
    },
    []
  )

  const handleMapClick = useCallback(
    async ({ lat, lng }: { lat: number; lng: number }) => {
      const result = await reverseGeocode(lat, lng)
      if (result) {
        const { state } = parseResult(result)
        const parts = result.display_name.split(',').slice(0, 3).join(',').trim()
        setSelectedLocation({
          name: parts,
          state,
          latitude: Number(result.lat),
          longitude: Number(result.lon),
          source: 'osm',
        })
      }
    },
    []
  )

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">
          <div className="dashboard__spinner" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Sidebar onSelect={selectLocation} />

      <div className="dashboard__content">
        <div className="dashboard__map">
          <InteractiveMap
            selectedLocation={selectedLocation}
            onMapClick={handleMapClick}
          />
        </div>

        <div className="dashboard__bottom">
          <RegionDetailCard location={selectedLocation} />
          <ChartPlaceholder />
        </div>
      </div>
    </div>
  )
}
