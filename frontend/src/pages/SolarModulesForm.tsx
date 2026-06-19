import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../api'
import type { SolarModule, SolarModuleFormData } from '../types'
import './SolarModulesForm.css'

interface FieldErrors {
  model?: string
  manufacturer?: string
  power_wp?: string
  efficiency?: string
  area_m2?: string
  quantity?: string
}

const initialFormData: SolarModuleFormData = {
  model: '',
  manufacturer: '',
  power_wp: '',
  efficiency: '',
  area_m2: '',
  quantity: '',
}

function validate(data: SolarModuleFormData): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.model.trim()) {
    errors.model = 'Informe o modelo do painel.'
  }

  if (!data.manufacturer.trim()) {
    errors.manufacturer = 'Informe o fabricante.'
  }

  if (data.power_wp === '' || Number(data.power_wp) <= 0) {
    errors.power_wp = 'A potência deve ser maior que zero.'
  }

  if (data.efficiency === '' || Number(data.efficiency) <= 0 || Number(data.efficiency) > 100) {
    errors.efficiency = 'A eficiência deve estar entre 0 e 100%.'
  }

  if (data.area_m2 === '' || Number(data.area_m2) <= 0) {
    errors.area_m2 = 'A área deve ser maior que zero.'
  }

  if (data.quantity === '' || Number(data.quantity) <= 0) {
    errors.quantity = 'A quantidade deve ser maior que zero.'
  }

  return errors
}

export function SolarModulesForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState<SolarModuleFormData>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingModule, setLoadingModule] = useState(isEditing)

  useEffect(() => {
    if (!id) return
    setLoadingModule(true)
    apiClient.get<SolarModule>(`/modules/${id}/`)
      .then((data) => {
        setFormData({
          model: data.model,
          manufacturer: data.manufacturer,
          power_wp: data.power_wp,
          efficiency: data.efficiency,
          area_m2: data.area_m2,
          quantity: data.quantity,
        })
      })
      .catch((err) => {
        setApiError(err instanceof Error ? err.message : 'Erro ao carregar módulo.')
      })
      .finally(() => setLoadingModule(false))
  }, [id])

  function handleChange(field: keyof SolarModuleFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError(null)

    const errors = validate(formData)
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    setSubmitting(true)

    const payload = {
      model: formData.model.trim(),
      manufacturer: formData.manufacturer.trim(),
      power_wp: Number(formData.power_wp),
      efficiency: Number(formData.efficiency),
      area_m2: Number(formData.area_m2),
      quantity: Number(formData.quantity),
    }

    try {
      if (isEditing) {
        await apiClient.put(`/modules/${id}/`, payload)
        navigate('/modules', {
          state: { message: 'Módulo atualizado com sucesso.' },
          replace: true,
        })
      } else {
        await apiClient.post('/modules/', payload)
        navigate('/modules', {
          state: { message: 'Módulo cadastrado com sucesso.' },
          replace: true,
        })
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao salvar módulo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingModule) {
    return (
      <div className="page-loading">
        <div className="page-loading__spinner" />
        <span>Carregando módulo...</span>
      </div>
    )
  }

  return (
    <div className="module-form-page">
      <Link to="/modules" className="module-form-page__back">
        &larr; Voltar
      </Link>

      <h1 className="module-form-page__title">
        {isEditing ? 'Editar Módulo' : 'Novo Módulo Solar'}
      </h1>
      <p className="module-form-page__subtitle">
        {isEditing
          ? 'Atualize as informações do painel solar.'
          : 'Cadastre um novo painel solar no sistema.'}
      </p>

      <form className="module-form" onSubmit={handleSubmit} noValidate>
        {apiError && <div className="module-form__api-error">{apiError}</div>}

        <div className="module-form__card">
          <div className="module-form__row">
            <label className="module-form__label" htmlFor="manufacturer">
              Fabricante<span className="module-form__required">*</span>
            </label>
            <input
              id="manufacturer"
              type="text"
              className={`module-form__input ${fieldErrors.manufacturer ? 'module-form__input--error' : ''}`}
              placeholder="Ex: Canadian Solar"
              value={formData.manufacturer}
              onChange={(e) => handleChange('manufacturer', e.target.value)}
              autoFocus
            />
            {fieldErrors.manufacturer && (
              <span className="module-form__error">{fieldErrors.manufacturer}</span>
            )}
          </div>

          <div className="module-form__row" style={{ marginTop: '1.25rem' }}>
            <label className="module-form__label" htmlFor="model">
              Modelo<span className="module-form__required">*</span>
            </label>
            <input
              id="model"
              type="text"
              className={`module-form__input ${fieldErrors.model ? 'module-form__input--error' : ''}`}
              placeholder="Ex: RS-540M10"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
            />
            {fieldErrors.model && (
              <span className="module-form__error">{fieldErrors.model}</span>
            )}
          </div>
        </div>

        <div className="module-form__card">
          <div className="module-form__grid">
            <div className="module-form__row">
              <label className="module-form__label" htmlFor="power_wp">
                Potência (Wp)<span className="module-form__required">*</span>
              </label>
              <input
                id="power_wp"
                type="number"
                step="0.01"
                min="0"
                className={`module-form__input ${fieldErrors.power_wp ? 'module-form__input--error' : ''}`}
                placeholder="Ex: 540"
                value={formData.power_wp}
                onChange={(e) => handleChange('power_wp', e.target.value)}
              />
              {fieldErrors.power_wp && (
                <span className="module-form__error">{fieldErrors.power_wp}</span>
              )}
            </div>

            <div className="module-form__row">
              <label className="module-form__label" htmlFor="efficiency">
                Eficiência (%)<span className="module-form__required">*</span>
              </label>
              <input
                id="efficiency"
                type="number"
                step="0.01"
                min="0"
                max="100"
                className={`module-form__input ${fieldErrors.efficiency ? 'module-form__input--error' : ''}`}
                placeholder="Ex: 21.5"
                value={formData.efficiency}
                onChange={(e) => handleChange('efficiency', e.target.value)}
              />
              {fieldErrors.efficiency && (
                <span className="module-form__error">{fieldErrors.efficiency}</span>
              )}
            </div>

            <div className="module-form__row">
              <label className="module-form__label" htmlFor="area_m2">
                Área (m²)<span className="module-form__required">*</span>
              </label>
              <input
                id="area_m2"
                type="number"
                step="0.001"
                min="0"
                className={`module-form__input ${fieldErrors.area_m2 ? 'module-form__input--error' : ''}`}
                placeholder="Ex: 2.5"
                value={formData.area_m2}
                onChange={(e) => handleChange('area_m2', e.target.value)}
              />
              {fieldErrors.area_m2 && (
                <span className="module-form__error">{fieldErrors.area_m2}</span>
              )}
            </div>

            <div className="module-form__row">
              <label className="module-form__label" htmlFor="quantity">
                Quantidade<span className="module-form__required">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                step="1"
                min="1"
                className={`module-form__input ${fieldErrors.quantity ? 'module-form__input--error' : ''}`}
                placeholder="Ex: 10"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
              />
              {fieldErrors.quantity && (
                <span className="module-form__error">{fieldErrors.quantity}</span>
              )}
            </div>
          </div>
        </div>

        <div className="module-form__actions">
          <Link to="/modules" className="module-form__btn module-form__btn--outline">
            Cancelar
          </Link>
          <button
            type="submit"
            className="module-form__btn module-form__btn--primary"
            disabled={submitting}
          >
            {submitting
              ? 'Salvando...'
              : isEditing
                ? 'Atualizar Módulo'
                : 'Cadastrar Módulo'}
          </button>
        </div>
      </form>
    </div>
  )
}
