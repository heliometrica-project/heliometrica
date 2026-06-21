import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '../api'
import { reverseGeocode, parseResult, searchLocation } from '../api/nominatim'
import type { NominatimResult } from '../api/nominatim'
import type { Region, SelectedLocation, SolarModule, EnergyEstimate, GenerationHistory } from '../types'
import { useAuth } from '../context/AuthContext'
import { InteractiveMap } from '../components/InteractiveMap'
import { MetricCard } from '../components/common/MetricCard'
import { SectionHeader } from '../components/common/SectionHeader'
import './Dashboard.css'

// ─── Helper ─────────────────────────────────────────
function fmt(v: number | string, decimals = 1) {
  return Number(v).toFixed(decimals)
}

// ─── Quick Estimate Panel ────────────────────────────
interface QuickEstimatePanelProps {
  modules: SolarModule[]
  selectedLocation: SelectedLocation | null
  onLocationSearch: (query: string) => void
  onLocationSelect: (item: NominatimResult) => void
  searchQuery: string
  searchResults: NominatimResult[]
  searchLoading: boolean
}

function QuickEstimatePanel({
  modules,
  selectedLocation,
  onLocationSearch,
  onLocationSelect,
  searchQuery,
  searchResults,
  searchLoading,
}: QuickEstimatePanelProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<number | ''>('')
  const [estimating, setEstimating] = useState(false)
  const [result, setResult] = useState<EnergyEstimate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [historyTitle, setHistoryTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load regions to match selected location
  useEffect(() => {
    apiClient.get<Region[]>('/regions/').then(setRegions).catch(() => {})
  }, [])

  // Auto-match region when location changes
  useEffect(() => {
    if (!selectedLocation || regions.length === 0) {
      setSelectedRegionId(null)
      return
    }
    const match = regions.find(
      (r) =>
        Math.abs(Number(r.latitude) - selectedLocation.latitude) < 0.5 &&
        Math.abs(Number(r.longitude) - selectedLocation.longitude) < 0.5,
    )
    setSelectedRegionId(match?.id ?? null)
  }, [selectedLocation, regions])

  async function handleEstimate() {
    if (!selectedRegionId || !selectedModuleId) return
    setError(null)
    setResult(null)
    setSaved(false)
    setEstimating(true)
    try {
      const data = await apiClient.post<EnergyEstimate>('/estimates/', {
        region_id: selectedRegionId,
        module_id: selectedModuleId,
      })
      setResult(data)
      setHistoryTitle(
        `${selectedLocation?.name ?? 'Estimativa'} – ${new Date().toLocaleDateString('pt-BR')}`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular estimativa.')
    } finally {
      setEstimating(false)
    }
  }

  async function handleSaveHistory() {
    if (!result || !historyTitle.trim()) return
    setSaving(true)
    try {
      await apiClient.post('/history/', {
        title: historyTitle.trim(),
        estimate: result.id,
        notes: '',
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar no histórico.')
    } finally {
      setSaving(false)
    }
  }

  const canEstimate = !!selectedRegionId && !!selectedModuleId && !estimating

  return (
    <div className="quick-estimate">
      <div className="quick-estimate__search-wrap">
        <label className="quick-estimate__field-label" htmlFor="loc-search">
          Localidade
        </label>
        <div className="quick-estimate__search-box">
          <span className="quick-estimate__search-icon">📍</span>
          <input
            id="loc-search"
            type="text"
            className="quick-estimate__search-input"
            placeholder="Pesquisar cidade ou clicar no mapa…"
            value={searchQuery}
            onChange={(e) => onLocationSearch(e.target.value)}
            autoComplete="off"
          />
          {searchLoading && <span className="quick-estimate__search-spinner" />}
        </div>

        {searchResults.length > 0 && (
          <ul className="quick-estimate__search-results">
            {searchResults.map((item, i) => {
              const { name, state } = parseResult(item)
              return (
                <li
                  key={i}
                  className="quick-estimate__search-result"
                  role="button"
                  tabIndex={0}
                  onClick={() => onLocationSelect(item)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onLocationSelect(item)}
                >
                  <span className="quick-estimate__result-name">{name}</span>
                  <span className="quick-estimate__result-state">{state}</span>
                </li>
              )
            })}
          </ul>
        )}

        {selectedLocation && (
          <div className="quick-estimate__location-chip">
            <span>📍</span>
            <span>{selectedLocation.name}</span>
            {selectedRegionId ? (
              <span className="badge badge--accent">Região cadastrada</span>
            ) : (
              <span className="badge" style={{ background: '#fef9c3', color: '#713f12' }}>
                Região não mapeada
              </span>
            )}
          </div>
        )}
      </div>

      <div className="quick-estimate__field">
        <label className="quick-estimate__field-label" htmlFor="module-select">
          Módulo Solar
        </label>
        {modules.length === 0 ? (
          <p className="quick-estimate__no-modules">
            <Link to="/modules/new">Cadastre um módulo</Link> para calcular estimativas.
          </p>
        ) : (
          <select
            id="module-select"
            className="quick-estimate__select"
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Selecionar módulo…</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.manufacturer} {m.model} — {m.power_wp} Wp × {m.quantity}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        id="estimate-btn"
        className="btn btn--primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={handleEstimate}
        disabled={!canEstimate}
      >
        {estimating ? 'Calculando…' : '⚡ Calcular Estimativa'}
      </button>

      {error && (
        <div className="toast toast--error" style={{ marginTop: '0.75rem' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="quick-estimate__result">
          <h3 className="quick-estimate__result-title">Resultado da Estimativa</h3>
          <div className="quick-estimate__metrics">
            <MetricCard label="Diário" value={fmt(result.daily_kwh, 2)} unit="kWh" icon="☀️" variant="primary" />
            <MetricCard label="Mensal" value={fmt(result.monthly_kwh, 1)} unit="kWh" icon="📅" variant="accent" />
            <MetricCard label="Anual" value={fmt(result.annual_kwh, 0)} unit="kWh" icon="📊" variant="info" />
            <MetricCard
              label="Eficiência PR"
              value={`${(Number(result.efficiency_index) * 100).toFixed(1)}%`}
              icon="⚡"
            />
          </div>

          {!saved ? (
            <div className="quick-estimate__save">
              <input
                type="text"
                className="field__input"
                placeholder="Nome para salvar no histórico…"
                value={historyTitle}
                onChange={(e) => setHistoryTitle(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn--outline btn--sm"
                onClick={handleSaveHistory}
                disabled={saving || !historyTitle.trim()}
              >
                {saving ? 'Salvando…' : '💾 Salvar'}
              </button>
            </div>
          ) : (
            <div className="toast toast--success" style={{ marginTop: '0.75rem' }}>
              ✓ Estimativa salva no histórico.
              <Link to="/history" className="btn btn--ghost btn--sm">Ver histórico</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────
export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [modules, setModules] = useState<SolarModule[]>([])
  const [history, setHistory] = useState<GenerationHistory[]>([])
  const [loadingModules, setLoadingModules] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Map / location state
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  // Load data
  useEffect(() => {
    apiClient.get<SolarModule[]>('/modules/')
      .then(setModules)
      .catch(() => {})
      .finally(() => setLoadingModules(false))

    apiClient.get<GenerationHistory[]>('/history/')
      .then((data) => setHistory(data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  // Debounced location search
  const handleLocationSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    searchTimer.current = setTimeout(async () => {
      const data = await searchLocation(query)
      setSearchResults(data)
      setSearchLoading(false)
    }, 400)
  }, [])

  const handleLocationSelect = useCallback((item: NominatimResult) => {
    const { name, state } = parseResult(item)
    setSelectedLocation({
      name: item.display_name,
      state,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      source: 'osm',
    })
    setSearchQuery(name)
    setSearchResults([])
  }, [])

  const handleMapClick = useCallback(async ({ lat, lng }: { lat: number; lng: number }) => {
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
      setSearchQuery(parts)
      setSearchResults([])
    }
  }, [])

  return (
    <div className="dashboard">
      {/* ── Welcome bar ── */}
      <div className="dashboard__welcome">
        <div className="dashboard__welcome-text">
          <h1 className="dashboard__welcome-title">
            Olá, {user?.username} 👋
          </h1>
          <p className="dashboard__welcome-sub">
            Calcule estimativas de energia solar e acompanhe seu histórico.
          </p>
        </div>
        <div className="dashboard__welcome-actions">
          <Link to="/modules/new" className="btn btn--outline btn--sm">
            + Novo Módulo
          </Link>
          <Link to="/history" className="btn btn--primary btn--sm">
            Ver Histórico
          </Link>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="dashboard__body">

        {/* Left column: map + quick estimate */}
        <div className="dashboard__left">

          {/* Map */}
          <div className="dashboard__card dashboard__card--map">
            <SectionHeader
              title="Mapa de Localidades"
              subtitle="Clique no mapa ou pesquise uma cidade"
            />
            <div className="dashboard__map-wrap">
              <InteractiveMap
                selectedLocation={selectedLocation}
                onMapClick={handleMapClick}
              />
            </div>
          </div>

          {/* Quick estimate */}
          <div className="dashboard__card">
            <SectionHeader
              title="Nova Estimativa"
              subtitle="Selecione uma localidade e um módulo para calcular"
            />
            <QuickEstimatePanel
              modules={modules}
              selectedLocation={selectedLocation}
              onLocationSearch={handleLocationSearch}
              onLocationSelect={handleLocationSelect}
              searchQuery={searchQuery}
              searchResults={searchResults}
              searchLoading={searchLoading}
            />
          </div>
        </div>

        {/* Right column: modules + history */}
        <div className="dashboard__right">

          {/* Modules summary */}
          <div className="dashboard__card">
            <SectionHeader
              title="Meus Módulos"
              subtitle={loadingModules ? '' : `${modules.length} módulo(s) cadastrado(s)`}
              action={
                <Link to="/modules" className="btn btn--ghost btn--sm">
                  Ver todos →
                </Link>
              }
            />

            {loadingModules ? (
              <div className="dashboard__list-loading">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
                ))}
              </div>
            ) : modules.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-state__icon">☀️</div>
                <p className="empty-state__title">Nenhum módulo cadastrado</p>
                <p className="empty-state__text">Cadastre seu primeiro painel solar.</p>
                <Link to="/modules/new" className="btn btn--primary btn--sm">
                  + Novo Módulo
                </Link>
              </div>
            ) : (
              <ul className="dashboard__module-list">
                {modules.slice(0, 4).map((m) => (
                  <li key={m.id} className="dashboard__module-item">
                    <div className="dashboard__module-icon">☀</div>
                    <div className="dashboard__module-info">
                      <span className="dashboard__module-name">
                        {m.manufacturer} {m.model}
                      </span>
                      <span className="dashboard__module-meta">
                        {m.power_wp} Wp · {m.efficiency}% · {m.quantity} un.
                      </span>
                    </div>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => navigate(`/modules/${m.id}/edit`)}
                      title="Editar"
                    >
                      ✎
                    </button>
                  </li>
                ))}
                {modules.length > 4 && (
                  <li className="dashboard__module-more">
                    <Link to="/modules">+{modules.length - 4} mais →</Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Recent history */}
          <div className="dashboard__card">
            <SectionHeader
              title="Histórico Recente"
              subtitle="Últimas estimativas salvas"
              action={
                <Link to="/history" className="btn btn--ghost btn--sm">
                  Ver todos →
                </Link>
              }
            />

            {loadingHistory ? (
              <div className="dashboard__list-loading">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-state__icon">📊</div>
                <p className="empty-state__title">Nenhuma estimativa salva</p>
                <p className="empty-state__text">
                  Calcule sua primeira estimativa e salve no histórico.
                </p>
              </div>
            ) : (
              <ul className="dashboard__history-list">
                {history.map((h) => (
                  <li key={h.id} className="dashboard__history-item">
                    <div className="dashboard__history-info">
                      <span className="dashboard__history-title">{h.title}</span>
                      <span className="dashboard__history-meta">
                        {h.region_name} · {h.region_state}
                      </span>
                    </div>
                    <div className="dashboard__history-values">
                      <span className="dashboard__history-kwh">
                        {fmt(h.daily_kwh, 2)} <small>kWh/dia</small>
                      </span>
                      <span className="dashboard__history-date">
                        {new Date(h.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick stats (if history loaded) */}
          {!loadingHistory && history.length > 0 && (
            <div className="dashboard__card">
              <SectionHeader title="Resumo Geral" />
              <div className="dashboard__stats-grid">
                <MetricCard
                  label="Estimativas"
                  value={history.length}
                  icon="📊"
                  variant="info"
                />
                <MetricCard
                  label="Módulos"
                  value={modules.length}
                  icon="☀️"
                  variant="primary"
                />
                <MetricCard
                  label="Melhor Diária"
                  value={fmt(Math.max(...history.map((h) => Number(h.daily_kwh))), 2)}
                  unit="kWh"
                  icon="⚡"
                  variant="accent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
