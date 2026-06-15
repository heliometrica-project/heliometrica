import { useState, useEffect } from 'react'
import { apiClient } from '../api'
import type { Region } from '../types'
import { RegionList } from '../components/RegionList'
import { InteractiveMap } from '../components/InteractiveMap'
import { RegionDetailCard } from '../components/RegionDetailCard'
import { ChartPlaceholder } from '../components/ChartPlaceholder'
import './Dashboard.css'

export function Dashboard() {
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    apiClient.get<Region[]>('/regions/')
      .then((data) => {
        setRegions(data)
        if (data.length > 0) {
          setSelectedRegion(data[0])
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar regiões')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (region: Region) => {
    setSelectedRegion(region)
  }

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
      <RegionList
        regions={regions}
        selectedId={selectedRegion?.id ?? null}
        onSelect={handleSelect}
      />

      <div className="dashboard__content">
        <div className="dashboard__map">
          <InteractiveMap
            regions={regions}
            selectedId={selectedRegion?.id ?? null}
            onSelect={handleSelect}
          />
        </div>

        <div className="dashboard__bottom">
          <RegionDetailCard region={selectedRegion} />
          <ChartPlaceholder />
        </div>
      </div>
    </div>
  )
}
