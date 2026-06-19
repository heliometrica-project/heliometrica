import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { apiClient } from '../api'
import type { SolarModule } from '../types'
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
        <span>Carregando módulos...</span>
      </div>
    )
  }

  return (
    <div className="modules-page">
      <div className="modules-page__header">
        <h1 className="modules-page__title">Módulos Solares</h1>
        <div className="modules-page__actions">
          <Link to="/modules/new" className="modules-page__btn modules-page__btn--primary">
            + Novo Módulo
          </Link>
        </div>
      </div>

      {error && (
        <div className="auth__error" style={{ marginBottom: '1.5rem' }}>{error}</div>
      )}

      {successMessage && (
        <div className="modules-page__success">
          <span>{successMessage}</span>
          <button className="modules-page__success-close" onClick={() => setSuccessMessage(null)}>
            &times;
          </button>
        </div>
      )}

      {modules.length === 0 ? (
        <div className="modules-page__empty">
          <div className="modules-page__empty-icon">☀️</div>
          <h2 className="modules-page__empty-title">Nenhum módulo cadastrado</h2>
          <p className="modules-page__empty-text">
            Cadastre seu primeiro painel solar para começar.
          </p>
          <Link to="/modules/new" className="modules-page__btn modules-page__btn--primary">
            + Novo Módulo
          </Link>
        </div>
      ) : (
        <div className="modules-list">
          {modules.map((mod) => (
            <div key={mod.id} className="modules-list__card">
              <div className="modules-list__info">
                <span className="modules-list__name">
                  {mod.manufacturer} {mod.model}
                </span>
                <div className="modules-list__meta">
                  <span>{mod.power_wp} Wp</span>
                  <span>{mod.efficiency}%</span>
                  <span>{mod.area_m2} m²</span>
                  <span className="modules-list__badge">Qtd: {mod.quantity}</span>
                </div>
              </div>
              <div className="modules-list__actions">
                <button
                  className="modules-page__btn modules-page__btn--outline modules-page__btn--sm"
                  onClick={() => navigate(`/modules/${mod.id}/edit`)}
                >
                  Editar
                </button>
                <button
                  className="modules-page__btn modules-page__btn--danger modules-page__btn--sm"
                  onClick={() => setDeleteTarget(mod)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="modules-list__confirm-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modules-list__confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="modules-list__confirm-title">Excluir módulo?</h3>
            <p className="modules-list__confirm-text">
              {deleteTarget.manufacturer} {deleteTarget.model} ({deleteTarget.power_wp} Wp) será removido permanentemente.
            </p>
            <div className="modules-list__confirm-actions">
              <button
                className="modules-page__btn modules-page__btn--outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="modules-page__btn modules-page__btn--danger"
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
