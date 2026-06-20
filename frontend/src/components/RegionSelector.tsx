import { useState, useEffect } from 'react'
import { apiClient } from '../api'
import type { Region } from '../types'
import './RegionSelector.css'

interface RegionSelectorProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export function RegionSelector({ selectedIds, onChange }: RegionSelectorProps) {
  const [regions, setRegions] = useState<Region[]>([])
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

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (loading) {
    return (
      <div className="region-selector__loading">
        <div className="region-selector__spinner" />
        <span>Carregando regiões...</span>
      </div>
    )
  }

  if (error) {
    return <p className="region-selector__error">{error}</p>
  }

  return (
    <div className="region-selector">
      <div className="region-selector__list">
        {regions.map((region) => {
          const isSelected = selectedIds.includes(region.id)
          return (
            <label
              key={region.id}
              className={`region-selector__item ${isSelected ? 'region-selector__item--selected' : ''}`}
            >
              <input
                type="checkbox"
                className="region-selector__checkbox"
                checked={isSelected}
                onChange={() => toggle(region.id)}
              />
              <span className="region-selector__name">{region.name}</span>
              <span className="region-selector__state">{region.state}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
