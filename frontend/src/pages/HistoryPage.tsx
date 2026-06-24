import { useState, useEffect } from 'react'
import { listHistory, updateHistory, deleteHistory, exportHistoryCsv } from '../api'
import type { HistoryRecord, HistoryUpdatePayload } from '../types'
import './HistoryPage.css'

function formatNumber(value: string | number | null | undefined, fractionDigits = 2) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(numeric)
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editTarget, setEditTarget] = useState<HistoryRecord | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<HistoryRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [exportingId, setExportingId] = useState<number | null>(null)

  function loadHistory() {
    setLoading(true)
    setError(null)
    listHistory()
      .then((data) => setRecords(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar histórico.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadHistory()
  }, [])

  function openEdit(record: HistoryRecord) {
    setEditTarget(record)
    setEditTitle(record.title)
    setEditNotes(record.notes)
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    setSaving(true)
    setError(null)
    try {
      const payload: HistoryUpdatePayload = {}
      if (editTitle !== editTarget.title) payload.title = editTitle
      if (editNotes !== editTarget.notes) payload.notes = editNotes
      if (Object.keys(payload).length === 0) {
        setEditTarget(null)
        setSaving(false)
        return
      }
      const updated = await updateHistory(editTarget.id, payload)
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setSuccessMessage('Histórico atualizado com sucesso.')
      setEditTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar histórico.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)
    try {
      await deleteHistory(deleteTarget.id)
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setSuccessMessage('Histórico excluído com sucesso.')
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir histórico.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleExport(record: HistoryRecord) {
    setExportingId(record.id)
    setError(null)
    try {
      const blob = await exportHistoryCsv(record.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${record.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSuccessMessage('CSV exportado com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar CSV.')
    } finally {
      setExportingId(null)
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading__spinner" />
        <span>Carregando histórico...</span>
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="history-page__container">
        <div className="history-page__header">
          <h1 className="history-page__title">Histórico</h1>
          <p className="history-page__subtitle">
            Gerencie suas estimativas salvas: visualize, edite, exporte ou exclua.
          </p>
        </div>

        {error && <div className="history-page__alert history-page__alert--error">{error}</div>}
        {successMessage && (
          <div className="history-page__alert history-page__alert--success">
            <span>{successMessage}</span>
            <button className="history-page__alert-close" onClick={() => setSuccessMessage(null)}>
              &times;
            </button>
          </div>
        )}

        {records.length === 0 ? (
          <div className="history-page__empty">
            <div className="history-page__empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2 className="history-page__empty-title">Nenhum histórico salvo</h2>
            <p className="history-page__empty-text">
              Após calcular uma estimativa, salve-a para acompanhar aqui.
            </p>
          </div>
        ) : (
          <div className="history-page__table-wrap">
            <table className="history-page__table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Região</th>
                  <th>kWh/dia</th>
                  <th>kWh/mês</th>
                  <th>PR (%)</th>
                  <th>Atualizado em</th>
                  <th className="history-page__th-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <HistoryRow
                    key={record.id}
                    record={record}
                    isExpanded={expandedId === record.id}
                    onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    onEdit={() => openEdit(record)}
                    onDelete={() => setDeleteTarget(record)}
                    onExport={() => handleExport(record)}
                    isExporting={exportingId === record.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTarget && (
        <div className="history-page__overlay" onClick={() => !saving && setEditTarget(null)}>
          <div className="history-page__modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="history-page__modal-title">Editar histórico</h2>
            <div className="history-page__modal-field">
              <label htmlFor="edit-title">Título</label>
              <input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="history-page__modal-field">
              <label htmlFor="edit-notes">Observações</label>
              <textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="history-page__modal-actions">
              <button
                className="history-page__btn history-page__btn--outline"
                onClick={() => setEditTarget(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="history-page__btn history-page__btn--primary"
                onClick={handleSaveEdit}
                disabled={saving || !editTitle.trim()}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="history-page__overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="history-page__modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="history-page__modal-title">Excluir histórico?</h2>
            <p className="history-page__modal-text">
              <strong>{deleteTarget.title}</strong> será removido permanentemente.
            </p>
            <div className="history-page__modal-actions">
              <button
                className="history-page__btn history-page__btn--outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="history-page__btn history-page__btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface HistoryRowProps {
  record: HistoryRecord
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onExport: () => void
  isExporting: boolean
}

function HistoryRow({ record, isExpanded, onToggle, onEdit, onDelete, onExport, isExporting }: HistoryRowProps) {
  return (
    <>
      <tr className="history-page__row" onClick={onToggle}>
        <td className="history-page__cell-title">{record.title}</td>
        <td>
          {record.region_name ? `${record.region_name}${record.region_state ? ` - ${record.region_state}` : ''}` : '-'}
        </td>
        <td>{formatNumber(record.daily_kwh, 3)}</td>
        <td>{formatNumber(record.monthly_kwh, 3)}</td>
        <td>{formatNumber(Number(record.efficiency_index) * 100)}</td>
        <td className="history-page__cell-date">{formatDate(record.updated_at)}</td>
        <td className="history-page__cell-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="history-page__btn history-page__btn--icon"
            onClick={onExport}
            disabled={isExporting}
            title="Exportar CSV"
          >
            {isExporting ? (
              <span className="history-page__mini-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </button>
          <button
            className="history-page__btn history-page__btn--icon"
            onClick={onEdit}
            title="Editar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className="history-page__btn history-page__btn--icon history-page__btn--icon-danger"
            onClick={onDelete}
            title="Excluir"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="history-page__detail-row">
          <td colSpan={7}>
            <div className="history-page__detail">
              <div className="history-page__detail-grid">
                <div>
                  <span className="history-page__detail-label">Título</span>
                  <span className="history-page__detail-value">{record.title}</span>
                </div>
                <div>
                  <span className="history-page__detail-label">Região</span>
                  <span className="history-page__detail-value">
                    {record.region_name ? `${record.region_name}${record.region_state ? ` - ${record.region_state}` : ''}` : '-'}
                  </span>
                </div>
                <div>
                  <span className="history-page__detail-label">Módulo</span>
                  <span className="history-page__detail-value">
                    {record.module_manufacturer ? `${record.module_manufacturer} ${record.module_model || ''}`.trim() : '-'}
                  </span>
                </div>
                <div>
                  <span className="history-page__detail-label">Potência do módulo</span>
                  <span className="history-page__detail-value">{formatNumber(record.module_power_wp)} Wp</span>
                </div>
                <div>
                  <span className="history-page__detail-label">kWh/dia</span>
                  <span className="history-page__detail-value">{formatNumber(record.daily_kwh, 3)}</span>
                </div>
                <div>
                  <span className="history-page__detail-label">kWh/mês</span>
                  <span className="history-page__detail-value">{formatNumber(record.monthly_kwh, 3)}</span>
                </div>
                <div>
                  <span className="history-page__detail-label">kWh/ano</span>
                  <span className="history-page__detail-value">{formatNumber(record.yearly_kwh, 3)}</span>
                </div>
                <div>
                  <span className="history-page__detail-label">PR (%)</span>
                  <span className="history-page__detail-value">{formatNumber(Number(record.efficiency_index) * 100)}</span>
                </div>
                <div>
                  <span className="history-page__detail-label">Observações</span>
                  <span className="history-page__detail-value">{record.notes || '-'}</span>
                </div>
                <div>
                  <span className="history-page__detail-label">Criado em</span>
                  <span className="history-page__detail-value">{formatDate(record.created_at)}</span>
                </div>
                <div>
                  <span className="history-page__detail-label">Atualizado em</span>
                  <span className="history-page__detail-value">{formatDate(record.updated_at)}</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
