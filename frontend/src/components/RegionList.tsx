import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api'
import type { Region } from '../types'
import './RegionList.css'

interface RegionListProps {
  selectedId: number | null
  onSelect: (region: Region) => void
}

export function RegionList({ selectedId, onSelect }: RegionListProps) {
  const [regions, setRegions] = useState<Region[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRegions = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<Region[]>('/regions/', {
        params: query ? { search: query } : undefined,
      })
      setRegions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar regiões')
      setRegions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRegions(search)
  }, [search, fetchRegions])

  return (
    <aside className="region-list">
      <div className="region-list__header">
        <h2 className="region-list__title">Heliométrica</h2>
      </div>

      <div className="region-list__search">
        <input
          type="text"
          placeholder="Buscar região..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="region-list__input"
        />
      </div>

      <div className="region-list__body">
        {loading && (
          <div className="region-list__state">
            <div className="region-list__spinner" />
            <p>Carregando regiões...</p>
          </div>
        )}

        {!loading && error && (
          <div className="region-list__state region-list__state--error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && regions.length === 0 && search && (
          <div className="region-list__state region-list__state--empty">
            <p>Nenhuma região encontrada para "{search}"</p>
          </div>
        )}

        {!loading && !error && regions.length === 0 && !search && (
          <div className="region-list__state region-list__state--empty">
            <p>Nenhuma região cadastrada</p>
          </div>
        )}

        {!loading && !error && regions.length > 0 && (
          <ul className="region-list__items">
            {regions.map((region) => (
              <li
                key={region.id}
                className={`region-list__item ${selectedId === region.id ? 'region-list__item--selected' : ''}`}
                onClick={() => onSelect(region)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(region)
                  }
                }}
              >
                <span className="region-list__item-name">{region.name}</span>
                <span className="region-list__item-state">{region.state}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
