import { useState, useRef, useEffect } from 'react'
import { searchLocation, parseResult, type NominatimResult } from '../api/nominatim'
import './Sidebar.css'

interface SidebarProps {
  onSelect: (location: { name: string; state: string; lat: number; lng: number }) => void
}

export function Sidebar({ onSelect }: SidebarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    timer.current = setTimeout(async () => {
      const data = await searchLocation(query)
      setResults(data)
      setLoading(false)
    }, 600)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query])

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__title">Heliométrica</h2>
      </div>

      <div className="sidebar__search">
        <input
          type="text"
          className="sidebar__input"
          placeholder="Pesquisar localização..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <span className="sidebar__spinner" />}
      </div>

      <div className="sidebar__body">
        {query && !loading && results.length === 0 && (
          <div className="sidebar__state">
            <p>Nenhum resultado encontrado</p>
          </div>
        )}

        {results.length > 0 && (
          <ul className="sidebar__items">
            {results.map((item, i) => {
              const { name, state } = parseResult(item)
              return (
                <li
                  key={i}
                  className="sidebar__item"
                  onClick={() =>
                    onSelect({
                      name,
                      state,
                      lat: Number(item.lat),
                      lng: Number(item.lon),
                    })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect({
                        name,
                        state,
                        lat: Number(item.lat),
                        lng: Number(item.lon),
                      })
                    }
                  }}
                >
                  <span className="sidebar__item-name">{name}</span>
                  <span className="sidebar__item-state">{state || item.display_name.split(',').slice(-2).join(',').trim()}</span>
                </li>
              )
            })}
          </ul>
        )}

        {!query && (
          <div className="sidebar__state">
            <p>Clique no mapa ou pesquise por uma localidade.</p>
          </div>
        )}
      </div>
    </aside>
  )
}
