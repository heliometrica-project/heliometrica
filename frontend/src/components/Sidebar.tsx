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
    }, 400)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query])

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__title">Localização</h2>
      </div>

      <div className="sidebar__search">
        <input
          type="text"
          className="sidebar__input"
          placeholder="Pesquisar localidade..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <span className="sidebar__spinner" />}
      </div>

      <div className="sidebar__body">
        {query && !loading && results.length === 0 && (
          <div className="sidebar__state">
            <p>Nenhum resultado encontrado para "{query}"</p>
          </div>
        )}

        {results.length > 0 && (
          <ul className="sidebar__items">
            {results.map((item, i) => {
              const { state } = parseResult(item)
              return (
                <li
                  key={i}
                  className="sidebar__item"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() =>
                    onSelect({
                      name: item.display_name,
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
                        name: item.display_name,
                        state,
                        lat: Number(item.lat),
                        lng: Number(item.lon),
                      })
                    }
                  }}
                >
                  <span className="sidebar__item-name">{state || item.display_name.split(',')[0].trim()}</span>
                  <span className="sidebar__item-state">{item.display_name}</span>
                </li>
              )
            })}
          </ul>
        )}

        {!query && (
          <div className="sidebar__state">
            <p>Clique no mapa ou digite para pesquisar uma localidade.</p>
          </div>
        )}
      </div>
    </aside>
  )
}
