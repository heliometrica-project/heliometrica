import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { apiClient, createCustomEstimate, createEstimate, getWeather, saveHistory } from '../api'
import { parseResult, reverseGeocode } from '../api/nominatim'
import { InteractiveMap } from '../components/InteractiveMap'
import type {
  EstimateResult,
  Region,
  SelectedLocation,
  SolarModule,
  WeatherSnapshot,
} from '../types'
import './EstimatePage.css'

interface FormState {
  regionId: string
  moduleId: string
}

const initialForm: FormState = {
  regionId: '',
  moduleId: '',
}

function formatNumber(value: string | number | null | undefined, fractionDigits = 2) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(numeric)
}

function getApiMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export function EstimatePage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [modules, setModules] = useState<SolarModule[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [regionInputMode, setRegionInputMode] = useState<'list' | 'map'>('list')
  const [mapLocation, setMapLocation] = useState<SelectedLocation | null>(null)
  const [loadingMapLocation, setLoadingMapLocation] = useState(false)
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [historyTitle, setHistoryTitle] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [savingHistory, setSavingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const selectedRegion = useMemo(
    () => regions.find((region) => String(region.id) === form.regionId),
    [form.regionId, regions]
  )

  const selectedModule = useMemo(
    () => modules.find((module) => String(module.id) === form.moduleId),
    [form.moduleId, modules]
  )

  const activeLocation: SelectedLocation | null =
    regionInputMode === 'map'
      ? mapLocation
      : selectedRegion
        ? {
            name: selectedRegion.name,
            state: selectedRegion.state,
            latitude: selectedRegion.latitude,
            longitude: selectedRegion.longitude,
            source: 'region',
          }
        : null

  useEffect(() => {
    let active = true
    setLoadingOptions(true)
    setError(null)

    Promise.all([
      apiClient.get<Region[]>('/regions/'),
      apiClient.get<SolarModule[]>('/modules/'),
    ])
      .then(([regionsData, modulesData]) => {
        if (!active) return
        setRegions(regionsData)
        setModules(modulesData)
      })
      .catch((err) => {
        if (!active) return
        setError(getApiMessage(err, 'Erro ao carregar dados para estimativa.'))
      })
      .finally(() => {
        if (active) setLoadingOptions(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!form.regionId) {
      setWeather(null)
      setWeatherError(null)
      return
    }

    let active = true
    setLoadingWeather(true)
    setWeather(null)
    setWeatherError(null)
    setResult(null)
    setSuccessMessage(null)

    getWeather(Number(form.regionId))
      .then((data) => {
        if (active) setWeather(data)
      })
      .catch((err) => {
        if (!active) return
        setWeatherError(
          getApiMessage(
            err,
            'Nao foi possivel consultar o clima desta regiao agora.'
          )
        )
      })
      .finally(() => {
        if (active) setLoadingWeather(false)
      })

    return () => {
      active = false
    }
  }, [form.regionId])

  function updateForm(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setResult(null)
    setSuccessMessage(null)
  }

  async function handleMapClick(latlng: { lat: number; lng: number }) {
    const clickedPoint = {
      latitude: Number(latlng.lat.toFixed(6)),
      longitude: Number(latlng.lng.toFixed(6)),
    }
    const fallbackName = `Ponto ${formatNumber(clickedPoint.latitude, 4)}, ${formatNumber(clickedPoint.longitude, 4)}`

    setLoadingMapLocation(true)
    setMapLocation({
      name: fallbackName,
      state: '',
      latitude: clickedPoint.latitude,
      longitude: clickedPoint.longitude,
      source: 'osm',
    })
    setResult(null)
    setSuccessMessage(null)

    try {
      const location = await reverseGeocode(clickedPoint.latitude, clickedPoint.longitude)
      if (!location) return
      const parsed = parseResult(location)
      setMapLocation({
        name: parsed.name || fallbackName,
        state: parsed.state,
        latitude: clickedPoint.latitude,
        longitude: clickedPoint.longitude,
        source: 'osm',
      })
    } finally {
      setLoadingMapLocation(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!form.moduleId) {
      setError('Selecione um modulo solar para calcular.')
      return
    }

    if (regionInputMode === 'list' && !form.regionId) {
      setError('Selecione uma regiao para calcular.')
      return
    }

    if (regionInputMode === 'map' && !mapLocation) {
      setError('Clique no mapa para escolher o ponto da estimativa.')
      return
    }

    setCalculating(true)
    try {
      const estimate =
        regionInputMode === 'map' && mapLocation
          ? await createCustomEstimate({
              module_id: Number(form.moduleId),
              name: mapLocation.name,
              state: mapLocation.state,
              latitude: mapLocation.latitude,
              longitude: mapLocation.longitude,
            })
          : await createEstimate({
              region_id: Number(form.regionId),
              module_id: Number(form.moduleId),
            })
      setResult(estimate)
      setHistoryTitle(
        activeLocation ? `Estimativa - ${activeLocation.name}` : 'Estimativa solar'
      )
    } catch (err) {
      setError(
        getApiMessage(
          err,
          'Nao foi possivel calcular a estimativa. Verifique os dados selecionados.'
        )
      )
    } finally {
      setCalculating(false)
    }
  }

  async function handleSaveHistory() {
    if (!result) return
    setSavingHistory(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await saveHistory({
        title: historyTitle.trim() || 'Estimativa solar',
        estimate: result.id,
        notes: [
          selectedModule
            ? `${selectedModule.manufacturer} ${selectedModule.model}`
            : '',
          regionInputMode === 'map' && mapLocation
            ? `Ponto: ${mapLocation.latitude}, ${mapLocation.longitude}`
            : '',
        ]
          .filter(Boolean)
          .join(' | '),
      })
      setSuccessMessage('Estimativa salva no historico.')
    } catch (err) {
      setError(getApiMessage(err, 'Erro ao salvar a estimativa no historico.'))
    } finally {
      setSavingHistory(false)
    }
  }

  const chartBars = result
    ? [
        { label: 'Dia', value: Number(result.daily_kwh), unit: 'kWh' },
        { label: 'Mes', value: Number(result.monthly_kwh), unit: 'kWh' },
        { label: 'Ano', value: Number(result.annual_kwh), unit: 'kWh' },
      ]
    : []
  const maxBarValue = Math.max(...chartBars.map((bar) => bar.value), 1)

  if (loadingOptions) {
    return (
      <div className="page-loading">
        <div className="page-loading__spinner" />
        <span>Carregando dados de estimativa...</span>
      </div>
    )
  }

  return (
    <div className="estimate-page">
      <div className="estimate-page__container">
        <header className="estimate-page__header">
          <h1 className="estimate-page__title">Estimativa Solar</h1>
          <p className="estimate-page__subtitle">
            Selecione uma regiao ou clique no mapa, escolha um modulo cadastrado
            e calcule a geracao esperada.
          </p>
        </header>

        {error && <div className="estimate-page__alert">{error}</div>}
        {successMessage && (
          <div className="estimate-page__success">{successMessage}</div>
        )}

        <div className="estimate-page__layout">
          <form className="estimate-form" onSubmit={handleSubmit}>
            <section className="estimate-form__section">
              <h2 className="estimate-form__title">Parametros</h2>

              <div className="estimate-form__tabs" aria-label="Forma de selecao">
                <button
                  type="button"
                  className={`estimate-form__tab ${
                    regionInputMode === 'list' ? 'estimate-form__tab--active' : ''
                  }`}
                  onClick={() => setRegionInputMode('list')}
                >
                  Lista
                </button>
                <button
                  type="button"
                  className={`estimate-form__tab ${
                    regionInputMode === 'map' ? 'estimate-form__tab--active' : ''
                  }`}
                  onClick={() => setRegionInputMode('map')}
                >
                  Mapa
                </button>
              </div>

              {regionInputMode === 'list' ? (
                <label className="estimate-form__field" htmlFor="region">
                  <span>Regiao</span>
                  <select
                    id="region"
                    value={form.regionId}
                    onChange={(event) =>
                      updateForm('regionId', event.target.value)
                    }
                  >
                    <option value="">Selecione uma regiao</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name} - {region.state}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="estimate-form__map-picker">
                  <InteractiveMap
                    selectedLocation={mapLocation}
                    onMapClick={handleMapClick}
                  />
                  <p className="estimate-form__map-help">
                    Clique no mapa para escolher o ponto exato da estimativa.
                  </p>
                  {mapLocation && (
                    <div className="estimate-form__map-selection">
                      <strong>{mapLocation.name}</strong>
                      {mapLocation.state && <span>{mapLocation.state}</span>}
                      <small>
                        {formatNumber(mapLocation.latitude, 6)},{' '}
                        {formatNumber(mapLocation.longitude, 6)}
                      </small>
                    </div>
                  )}
                  {loadingMapLocation && (
                    <p className="estimate-form__map-help">
                      Identificando o ponto selecionado...
                    </p>
                  )}
                </div>
              )}

              <label className="estimate-form__field" htmlFor="module">
                <span>Modulo solar</span>
                <select
                  id="module"
                  value={form.moduleId}
                  onChange={(event) => updateForm('moduleId', event.target.value)}
                >
                  <option value="">Selecione um modulo</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.manufacturer} {module.model} - {module.power_wp} Wp
                    </option>
                  ))}
                </select>
              </label>

              {modules.length === 0 && (
                <p className="estimate-form__hint">
                  Cadastre um modulo solar antes de calcular estimativas.
                </p>
              )}

              <button
                type="submit"
                className="estimate-form__button"
                disabled={
                  calculating ||
                  !form.moduleId ||
                  (regionInputMode === 'list' && !form.regionId) ||
                  (regionInputMode === 'map' && !mapLocation)
                }
              >
                {calculating ? 'Calculando...' : 'Calcular estimativa'}
              </button>
            </section>

            <section className="estimate-form__section">
              <h2 className="estimate-form__title">Clima da regiao</h2>
              {regionInputMode === 'map' ? (
                <p className="estimate-weather__empty">
                  No modo mapa, os dados climaticos sao consultados no ponto
                  clicado durante o calculo.
                </p>
              ) : !form.regionId && (
                <p className="estimate-weather__empty">
                  Selecione uma regiao para consultar os dados climaticos.
                </p>
              )}
              {regionInputMode === 'list' && loadingWeather && (
                <div className="estimate-weather__loading">
                  <span className="estimate-weather__spinner" />
                  Consultando clima...
                </div>
              )}
              {regionInputMode === 'list' && weatherError && (
                <div className="estimate-weather__error">
                  Nao conseguimos consultar a API de clima agora. {weatherError}
                </div>
              )}
              {regionInputMode === 'list' && weather && (
                <div className="estimate-weather">
                  <div>
                    <span>Irradiacao</span>
                    <strong>{formatNumber(weather.irradiation, 3)} kWh/m²</strong>
                  </div>
                  <div>
                    <span>Temperatura</span>
                    <strong>{formatNumber(weather.temperature)} °C</strong>
                  </div>
                  <div>
                    <span>Nuvens</span>
                    <strong>{formatNumber(weather.cloud_cover)}%</strong>
                  </div>
                  {weather.fallback_message && (
                    <p className="estimate-weather__warning">
                      {weather.fallback_message}
                    </p>
                  )}
                  {weather.warning && (
                    <p className="estimate-weather__warning">{weather.warning}</p>
                  )}
                </div>
              )}
            </section>
          </form>

          <main className="estimate-result">
            {!result ? (
              <div className="estimate-result__empty">
                <h2>Resultado da estimativa</h2>
                <p>
                  O calculo mostrara a geracao estimada em kWh por dia, mes e
                  ano.
                </p>
              </div>
            ) : (
              <>
                <section className="estimate-result__summary">
                  <div className="estimate-result__summary-header">
                    <div>
                      <h2>Resultado</h2>
                      <p>
                        {activeLocation?.name}
                        {activeLocation?.state ? ` - ${activeLocation.state}` : ''}
                      </p>
                    </div>
                    <span className="estimate-result__badge">
                      PR {formatNumber(result.efficiency_index)}%
                    </span>
                  </div>

                  <div className="estimate-result__metrics">
                    <div>
                      <span>kWh/dia</span>
                      <strong>{formatNumber(result.daily_kwh, 3)}</strong>
                    </div>
                    <div>
                      <span>kWh/mes</span>
                      <strong>{formatNumber(result.monthly_kwh, 3)}</strong>
                    </div>
                    <div>
                      <span>kWh/ano</span>
                      <strong>{formatNumber(result.annual_kwh, 3)}</strong>
                    </div>
                  </div>
                </section>

                <section className="estimate-result__chart" aria-label="Grafico">
                  {chartBars.map((bar) => (
                    <div key={bar.label} className="estimate-result__bar-row">
                      <span>{bar.label}</span>
                      <div className="estimate-result__bar-track">
                        <div
                          className="estimate-result__bar"
                          style={{
                            width: `${Math.max((bar.value / maxBarValue) * 100, 4)}%`,
                          }}
                        />
                      </div>
                      <strong>
                        {formatNumber(bar.value, 3)} {bar.unit}
                      </strong>
                    </div>
                  ))}
                </section>

                <section className="estimate-history">
                  <label className="estimate-history__field" htmlFor="history-title">
                    <span>Titulo do historico</span>
                    <input
                      id="history-title"
                      value={historyTitle}
                      onChange={(event) => setHistoryTitle(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="estimate-history__button"
                    onClick={handleSaveHistory}
                    disabled={savingHistory}
                  >
                    {savingHistory ? 'Salvando...' : 'Salvar historico'}
                  </button>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
