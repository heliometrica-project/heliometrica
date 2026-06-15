import { useState, useMemo } from 'react'
import type { Region } from '../types'
import './RegionList.css'

interface RegionListProps {
  regions: Region[]
  selectedId: number | null
  onSelect: (region: Region) => void
}

export function RegionList({ regions, selectedId, onSelect }: RegionListProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return regions
    const q = search.toLowerCase()
    return regions.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q)
    )
  }, [regions, search])

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
        {regions.length === 0 && (
          <div className="region-list__state region-list__state--empty">
            <p>Nenhuma região cadastrada</p>
          </div>
        )}

        {regions.length > 0 && filtered.length === 0 && (
          <div className="region-list__state region-list__state--empty">
            <p>Nenhuma região encontrada para "{search}"</p>
          </div>
        )}

        {filtered.length > 0 && (
          <ul className="region-list__items">
            {filtered.map((region) => (
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
