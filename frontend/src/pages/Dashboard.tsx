import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api'
import type { Region } from '../types'
import { InteractiveMap } from '../components/InteractiveMap'
import { RegionDetailCard } from '../components/RegionDetailCard'
import { ChartPlaceholder } from '../components/ChartPlaceholder'
import './Dashboard.css'

const MAX_DISTANCE_KM = 5

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function Dashboard() {
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiClient.get<Region[]>('/regions/')
      .then((data) => setRegions(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar regiões'))
      .finally(() => setLoading(false))
  }, [])

  const handleMapClick = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      let nearest: Region | null = null
      let nearestDist = Infinity

      for (const r of regions) {
        const dist = haversineKm(lat, lng, Number(r.latitude), Number(r.longitude))
        if (dist < nearestDist) {
          nearestDist = dist
          nearest = r
        }
      }

      if (nearest && nearestDist <= MAX_DISTANCE_KM) {
        setSelectedRegion(nearest)
      } else {
        setSelectedRegion(null)
      }
    },
    [regions]
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
          <p>Erro ao carregar dados: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard__map">
        <InteractiveMap
          selectedRegion={selectedRegion}
          onMapClick={handleMapClick}
        />
      </div>

      <div className="dashboard__bottom">
        <RegionDetailCard region={selectedRegion} />
        <ChartPlaceholder />
      </div>
    </div>
  )
}
