import { useState, useCallback } from 'react'
import { compareRegions, compareCustom } from '../api/compare'
import { reverseGeocode, parseResult } from '../api/nominatim'
import type { CompareResponse, CustomCompareResponse, CustomLocation } from '../types'
import { RegionSelector } from '../components/RegionSelector'
import { CompareChart } from '../components/CompareChart'
import { MultiMarkerMap } from '../components/InteractiveMap'
import './ComparePage.css'

type Tab = 'regions' | 'map'
type ResultType = { kind: 'regions'; data: CompareResponse } | { kind: 'custom'; data: CustomCompareResponse }

let nextLocationId = 1

export function ComparePage() {
  const [activeTab, setActiveTab] = useState<Tab>('regions')

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [result, setResult] = useState<ResultType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mapLocations, setMapLocations] = useState<CustomLocation[]>([])

  async function handleCompareRegions() {
    if (selectedIds.length < 2) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await compareRegions({ region_ids: selectedIds })
      setResult({ kind: 'regions', data })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comparar regiões')
    } finally {
      setLoading(false)
    }
  }

  async function handleCompareCustom() {
    if (mapLocations.length < 2) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await compareCustom({ locations: mapLocations })
      setResult({ kind: 'custom', data })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comparar localizações')
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = useCallback(async ({ lat, lng }: { lat: number; lng: number }) => {
    const result = await reverseGeocode(lat, lng)
    let name = `Ponto ${nextLocationId}`
    let state = ''
    if (result) {
      const parsed = parseResult(result)
      name = parsed.name || name
      state = parsed.state
    }
    setMapLocations((prev) => [
      ...prev,
      { id: nextLocationId++, name, state, latitude: Number(lat.toFixed(4)), longitude: Number(lng.toFixed(4)) },
    ])
  }, [])

  function removeMapLocation(id: number) {
    setMapLocations((prev) => prev.filter((l) => l.id !== id))
  }

  function clearMapLocations() {
    setMapLocations([])
  }

  const canCompare = activeTab === 'regions'
    ? selectedIds.length >= 2
    : mapLocations.length >= 2

  const selectedCount = activeTab === 'regions' ? selectedIds.length : mapLocations.length

  function handleCompare() {
    if (activeTab === 'regions') handleCompareRegions()
    else handleCompareCustom()
  }

  function buildChartProps(result: ResultType) {
    if (result.kind === 'regions') return { data: result.data }
    return {
      data: {
        metric: result.data.metric,
        region_ids: result.data.locations.map((l) => l.id),
        series: result.data.series.map((s) => ({
          region_id: s.location_id,
          region_name: s.location_name,
          region_state: s.location_state,
          estimates_count: 0,
          daily_kwh: s.daily_kwh,
          monthly_kwh: s.monthly_kwh,
          yearly_kwh: s.yearly_kwh,
          efficiency_index: null,
        })),
        chart: result.data.chart,
      },
    }
  }

  const hasSeries = result && (
    (result.kind === 'regions' && result.data.series.length > 0 && result.data.series.some((s) => s.daily_kwh !== null)) ||
    (result.kind === 'custom' && result.data.series.length > 0)
  )

  return (
    <div className="compare-page">
      <div className="compare-page__container">
        <div className="compare-page__header">
          <h1 className="compare-page__title">Comparar Regiões</h1>
          <p className="compare-page__subtitle">
            Selecione duas ou mais regiões cadastradas ou pontos no mapa para comparar o potencial de geração de energia solar.
          </p>
        </div>

        <div className="compare-page__tabs">
          <button
            className={`compare-page__tab ${activeTab === 'regions' ? 'compare-page__tab--active' : ''}`}
            onClick={() => { setActiveTab('regions'); setResult(null); setError(null) }}
          >
            Regiões cadastradas
          </button>
          <button
            className={`compare-page__tab ${activeTab === 'map' ? 'compare-page__tab--active' : ''}`}
            onClick={() => { setActiveTab('map'); setResult(null); setError(null) }}
          >
            Selecionar no mapa
          </button>
        </div>

        <div className="compare-page__layout">
          <aside className="compare-page__sidebar">
            {activeTab === 'regions' && (
              <div className="compare-page__selector-card">
                <h2 className="compare-page__selector-title">Regiões</h2>
                <RegionSelector
                  selectedIds={selectedIds}
                  onChange={setSelectedIds}
                />
              </div>
            )}

            {activeTab === 'map' && (
              <div className="compare-page__selector-card">
                <h2 className="compare-page__selector-title">Localizações selecionadas</h2>
                {mapLocations.length === 0 ? (
                  <p className="compare-page__map-hint">Clique no mapa para adicionar pontos.</p>
                ) : (
                  <ul className="compare-page__map-list">
                    {mapLocations.map((loc, i) => (
                      <li key={loc.id} className="compare-page__map-item">
                        <span
                          className="compare-page__map-dot"
                          style={{ backgroundColor: ['#d97706', '#059669', '#2563eb', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#65a30d'][i % 8] }}
                        />
                        <span className="compare-page__map-name">{loc.name}</span>
                        {loc.state && <span className="compare-page__map-state">{loc.state}</span>}
                        <button
                          className="compare-page__map-remove"
                          onClick={() => removeMapLocation(loc.id)}
                          title="Remover"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {mapLocations.length > 0 && (
                  <button className="compare-page__map-clear" onClick={clearMapLocations}>
                    Limpar pontos
                  </button>
                )}
              </div>
            )}

            <button
              className="compare-page__btn"
              onClick={handleCompare}
              disabled={!canCompare || loading}
            >
              {loading ? (
                <>
                  <span className="compare-page__btn-spinner" />
                  Comparando...
                </>
              ) : (
                'Comparar'
              )}
            </button>

            {selectedCount > 0 && selectedCount < 2 && (
              <p className="compare-page__hint">
                Selecione ao menos 2 {activeTab === 'regions' ? 'regiões' : 'pontos'} para comparar.
              </p>
            )}
          </aside>

          <main className="compare-page__main">
            {activeTab === 'map' && !result && (
              <div className="compare-page__map-area">
                <MultiMarkerMap markers={mapLocations} onMapClick={handleMapClick} />
              </div>
            )}

            {error && (
              <div className="compare-page__error">
                <p>{error}</p>
              </div>
            )}

            {!result && !error && !loading && activeTab === 'regions' && (
              <div className="compare-page__empty">
                <div className="compare-page__empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <h2 className="compare-page__empty-title">Nenhuma comparação ainda</h2>
                <p className="compare-page__empty-text">
                  Selecione as regiões no painel ao lado e clique em <strong>Comparar</strong> para visualizar os resultados.
                </p>
              </div>
            )}

            {loading && (
              <div className="compare-page__loading">
                <div className="compare-page__spinner" />
                <p>Comparando regiões...</p>
              </div>
            )}

            {result && !hasSeries && (
              <div className="compare-page__empty">
                <div className="compare-page__empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <h2 className="compare-page__empty-title">Sem dados</h2>
                <p className="compare-page__empty-text">
                  Não há estimativas de energia disponíveis para as regiões selecionadas.
                </p>
              </div>
            )}

            {result && hasSeries && (
              <CompareChart {...buildChartProps(result)} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
