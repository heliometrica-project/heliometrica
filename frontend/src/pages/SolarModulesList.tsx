import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { apiClient } from '../api'
import type { SolarModule } from '../types'
import { SectionHeader } from '../components/common/SectionHeader'
import './SolarModulesList.css'

export function SolarModulesList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [modules, setModules] = useState<SolarModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SolarModule | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const message = location.state?.message as string | undefined

  useEffect(() => {
    if (message) {
      setSuccessMessage(message)
      window.history.replaceState({}, '')
    }
  }, [message])

  useEffect(() => {
    setLoading(true)
    apiClient.get<SolarModule[]>('/modules/')
      .then((data) => setModules(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar módulos.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiClient.delete(`/modules/${deleteTarget.id}/`)
      setModules((prev) => prev.filter((m) => m.id !== deleteTarget.id))
      setSuccessMessage('Módulo excluído com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir módulo.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading__spinner" />
        <span>Carregando módulos…</span>
      </div>
    )
  }

  return (
    <div className="modules-page">
      <SectionHeader
        title="Módulos Solares"
        subtitle={`${modules.length} módulo(s) cadastrado(s)`}
        action={
          <Link to="/modules/new" className="btn btn--primary btn--sm" id="new-module-btn">
            + Novo Módulo
          </Link>
        }
      />

      {error && (
        <div className="toast toast--error" style={{ marginBottom: '1rem' }}>
          {error}
          <button className="toast__close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="toast toast--success" style={{ marginBottom: '1rem' }}>
          {successMessage}
          <button className="toast__close" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      {modules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">☀️</div>
          <p className="empty-state__title">Nenhum módulo cadastrado</p>
          <p className="empty-state__text">
            Cadastre seu primeiro painel solar para começar a calcular estimativas.
          </p>
          <Link to="/modules/new" className="btn btn--primary">
            + Cadastrar Módulo
          </Link>
        </div>
      ) : (
        <div className="modules-grid">
          {modules.map((mod, i) => (
            <div
              key={mod.id}
              className="module-card"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="module-card__header">
                <div className="module-card__icon">☀</div>
                <div className="module-card__identity">
                  <span className="module-card__name">
                    {mod.manufacturer} {mod.model}
                  </span>
                  <span className="module-card__date">
                    Cadastrado em {new Date(mod.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <span className="badge badge--primary">Qtd: {mod.quantity}</span>
              </div>

              <div className="module-card__specs">
                <div className="module-card__spec">
                  <span className="module-card__spec-label">Potência</span>
                  <span className="module-card__spec-value">{mod.power_wp} Wp</span>
                </div>
                <div className="module-card__spec">
                  <span className="module-card__spec-label">Eficiência</span>
                  <span className="module-card__spec-value">{mod.efficiency}%</span>
                </div>
                <div className="module-card__spec">
                  <span className="module-card__spec-label">Área</span>
                  <span className="module-card__spec-value">{mod.area_m2} m²</span>
                </div>
                <div className="module-card__spec">
                  <span className="module-card__spec-label">Total</span>
                  <span className="module-card__spec-value">
                    {(Number(mod.power_wp) * mod.quantity).toFixed(0)} Wp
                  </span>
                </div>
              </div>

              <div className="module-card__actions">
                <button
                  className="btn btn--outline btn--sm"
                  onClick={() => navigate(`/modules/${mod.id}/edit`)}
                  id={`edit-module-${mod.id}`}
                >
                  ✎ Editar
                </button>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => setDeleteTarget(mod)}
                  id={`delete-module-${mod.id}`}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Excluir módulo?</h2>
            <p className="modal__text">
              <strong>{deleteTarget.manufacturer} {deleteTarget.model}</strong>{' '}
              ({deleteTarget.power_wp} Wp) será removido permanentemente.
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
