import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../api'
import type { GenerationHistory } from '../types'
import { SectionHeader } from '../components/common/SectionHeader'
import { MetricCard } from '../components/common/MetricCard'
import './History.css'

function fmt(v: number | string, decimals = 1) {
  return Number(v).toFixed(decimals)
}

function HistoryCard({ item, onDelete }: { item: GenerationHistory; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/history/${item.id}/export/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('heliometrica_token')}`,
          },
        },
      )
      if (!res.ok) throw new Error('Erro ao exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `estimativa-${item.id}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail for now
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={`history-card ${expanded ? 'history-card--expanded' : ''}`}>
      {/* Card header row */}
      <div
        className="history-card__header"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded((v) => !v)}
      >
        <div className="history-card__icon">📊</div>
        <div className="history-card__info">
          <span className="history-card__title">{item.title}</span>
          <span className="history-card__meta">
            {item.region_name} · {item.region_state}
            {item.module_manufacturer && (
              <> · {item.module_manufacturer} {item.module_model}</>
            )}
          </span>
        </div>
        <div className="history-card__summary">
          <span className="history-card__kwh">
            {fmt(item.daily_kwh, 2)} <small>kWh/dia</small>
          </span>
          <span className="history-card__date">
            {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <button
          className="history-card__chevron"
          aria-label={expanded ? 'Fechar detalhes' : 'Ver detalhes'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="history-card__details">
          <div className="history-card__metrics">
            <MetricCard label="Diário" value={fmt(item.daily_kwh, 2)} unit="kWh" icon="☀️" variant="primary" />
            <MetricCard label="Mensal" value={fmt(item.monthly_kwh, 1)} unit="kWh" icon="📅" variant="accent" />
            <MetricCard label="Anual" value={fmt(item.yearly_kwh, 0)} unit="kWh" icon="📊" variant="info" />
            <MetricCard
              label="Eficiência PR"
              value={`${(Number(item.efficiency_index) * 100).toFixed(1)}%`}
              icon="⚡"
            />
          </div>
          {item.notes && (
            <p className="history-card__notes">{item.notes}</p>
          )}
          <div className="history-card__actions">
            <button
              className="btn btn--outline btn--sm"
              onClick={handleExport}
              disabled={exporting}
              id={`export-btn-${item.id}`}
            >
              {exporting ? 'Exportando…' : '⬇ Exportar CSV'}
            </button>
            <button
              className="btn btn--danger btn--sm"
              onClick={() => onDelete(item.id)}
              id={`delete-btn-${item.id}`}
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function History() {
  const [items, setItems] = useState<GenerationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'kwh'>('date')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiClient.get<GenerationHistory[]>('/history/')
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar histórico.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const result = items.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        h.region_name.toLowerCase().includes(q) ||
        h.region_state.toLowerCase().includes(q),
    )
    if (sortBy === 'kwh') {
      result.sort((a, b) => Number(b.daily_kwh) - Number(a.daily_kwh))
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return result
  }, [items, search, sortBy])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiClient.delete(`/history/${deleteTarget}/`)
      setItems((prev) => prev.filter((h) => h.id !== deleteTarget))
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading__spinner" />
        <span>Carregando histórico…</span>
      </div>
    )
  }

  return (
    <div className="history-page">
      <SectionHeader
        title="Histórico de Estimativas"
        subtitle={`${items.length} estimativa(s) salva(s)`}
        action={
          <Link to="/dashboard" className="btn btn--primary btn--sm">
            + Nova Estimativa
          </Link>
        }
      />

      {error && (
        <div className="toast toast--error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="history-toolbar">
        <div className="history-toolbar__search">
          <span className="history-toolbar__search-icon">🔍</span>
          <input
            id="history-search"
            type="text"
            className="history-toolbar__search-input"
            placeholder="Filtrar por título, região…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="history-toolbar__clear"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
            >
              ×
            </button>
          )}
        </div>

        <div className="history-toolbar__sort">
          <label htmlFor="sort-select" className="history-toolbar__sort-label">Ordenar:</label>
          <select
            id="sort-select"
            className="history-toolbar__sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'kwh')}
          >
            <option value="date">Mais recentes</option>
            <option value="kwh">Maior produção</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="history-results-count">
          {filtered.length} resultado(s) para "{search}"
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">{search ? '🔍' : '📊'}</div>
          <p className="empty-state__title">
            {search ? 'Nenhum resultado encontrado' : 'Histórico vazio'}
          </p>
          <p className="empty-state__text">
            {search
              ? `Tente outros termos de busca.`
              : 'Calcule uma estimativa no Dashboard e salve-a aqui.'}
          </p>
          {!search && (
            <Link to="/dashboard" className="btn btn--primary btn--sm">
              Ir para o Dashboard
            </Link>
          )}
        </div>
      ) : (
        <div className="history-list">
          {filtered.map((item, i) => (
            <div
              key={item.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="history-list__item"
            >
              <HistoryCard item={item} onDelete={(id) => setDeleteTarget(id)} />
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget !== null && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Excluir estimativa?</h2>
            <p className="modal__text">
              Esta ação é irreversível. O registro será removido permanentemente do histórico.
            </p>
            <div className="modal__actions">
              <button
                className="btn btn--outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="btn btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
