import { useState } from 'react'
import { compareRegions } from '../api/compare'
import type { CompareResponse } from '../types'
import { RegionSelector } from '../components/RegionSelector'
import { CompareChart } from '../components/CompareChart'
import './ComparePage.css'

export function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCompare() {
    if (selectedIds.length < 2) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await compareRegions({ region_ids: selectedIds })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comparar regiões')
    } finally {
      setLoading(false)
    }
  }

  const canCompare = selectedIds.length >= 2

  return (
    <div className="compare-page">
      <div className="compare-page__container">
        <div className="compare-page__header">
          <h1 className="compare-page__title">Comparar Regiões</h1>
          <p className="compare-page__subtitle">
            Selecione duas ou mais regiões para comparar o potencial de geração de energia solar.
          </p>
        </div>

        <div className="compare-page__layout">
          <aside className="compare-page__sidebar">
            <div className="compare-page__selector-card">
              <h2 className="compare-page__selector-title">Regiões</h2>
              <RegionSelector
                selectedIds={selectedIds}
                onChange={setSelectedIds}
              />
            </div>

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

            {!canCompare && selectedIds.length > 0 && selectedIds.length < 2 && (
              <p className="compare-page__hint">
                Selecione ao menos 2 regiões para comparar.
              </p>
            )}
          </aside>

          <main className="compare-page__main">
            {error && (
              <div className="compare-page__error">
                <p>{error}</p>
              </div>
            )}

            {!result && !error && !loading && (
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

            {result && result.series.length === 0 && (
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

            {result && result.series.length > 0 && (
              <CompareChart data={result} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
