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

  if (!data.model.trim()) errors.model = 'Informe o modelo do painel.'
  if (!data.manufacturer.trim()) errors.manufacturer = 'Informe o fabricante.'

  if (data.power_wp === '' || Number(data.power_wp) <= 0)
    errors.power_wp = 'A potência deve ser maior que zero.'

  if (data.efficiency === '' || Number(data.efficiency) <= 0 || Number(data.efficiency) > 100)
    errors.efficiency = 'A eficiência deve estar entre 0 e 100%.'

  if (data.area_m2 === '' || Number(data.area_m2) <= 0)
    errors.area_m2 = 'A área deve ser maior que zero.'

  if (data.quantity === '' || Number(data.quantity) <= 0)
    errors.quantity = 'A quantidade deve ser maior que zero.'

  return errors
}

interface FieldProps {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
  error?: string
}

function Field({ id, label, required, children, error }: FieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="field__required">*</span>}
      </label>
      {children}
      {error && <span className="field__error">{error}</span>}
    </div>
  )
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
        navigate('/modules', { state: { message: 'Módulo atualizado com sucesso.' }, replace: true })
      } else {
        await apiClient.post('/modules/', payload)
        navigate('/modules', { state: { message: 'Módulo cadastrado com sucesso.' }, replace: true })
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
        <span>Carregando módulo…</span>
      </div>
    )
  }

  return (
    <div className="module-form-page">
      <Link to="/modules" className="module-form-page__back">
        ← Voltar para Módulos
      </Link>

      <div className="module-form-page__head">
        <div className="module-form-page__head-icon">{isEditing ? '✎' : '+'}</div>
        <div>
          <h1 className="module-form-page__title">
            {isEditing ? 'Editar Módulo' : 'Novo Módulo Solar'}
          </h1>
          <p className="module-form-page__subtitle">
            {isEditing
              ? 'Atualize as informações do painel solar.'
              : 'Cadastre um novo painel solar no sistema.'}
          </p>
        </div>
      </div>

      <form className="module-form" onSubmit={handleSubmit} noValidate>
        {apiError && (
          <div className="toast toast--error">
            {apiError}
          </div>
        )}

        {/* Identification card */}
        <section className="module-form__section">
          <h2 className="module-form__section-title">Identificação</h2>
          <div className="module-form__fields">
            <Field id="manufacturer" label="Fabricante" required error={fieldErrors.manufacturer}>
              <input
                id="manufacturer"
                type="text"
                className={`field__input ${fieldErrors.manufacturer ? 'field__input--error' : ''}`}
                placeholder="Ex: Canadian Solar"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                autoFocus
              />
            </Field>

            <Field id="model" label="Modelo" required error={fieldErrors.model}>
              <input
                id="model"
                type="text"
                className={`field__input ${fieldErrors.model ? 'field__input--error' : ''}`}
                placeholder="Ex: RS-540M10"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* Technical specs card */}
        <section className="module-form__section">
          <h2 className="module-form__section-title">Especificações Técnicas</h2>
          <div className="module-form__grid">
            <Field id="power_wp" label="Potência (Wp)" required error={fieldErrors.power_wp}>
              <input
                id="power_wp"
                type="number"
                step="0.01"
                min="0"
                className={`field__input ${fieldErrors.power_wp ? 'field__input--error' : ''}`}
                placeholder="Ex: 540"
                value={formData.power_wp}
                onChange={(e) => handleChange('power_wp', e.target.value)}
              />
            </Field>

            <Field id="efficiency" label="Eficiência (%)" required error={fieldErrors.efficiency}>
              <input
                id="efficiency"
                type="number"
                step="0.01"
                min="0"
                max="100"
                className={`field__input ${fieldErrors.efficiency ? 'field__input--error' : ''}`}
                placeholder="Ex: 21.5"
                value={formData.efficiency}
                onChange={(e) => handleChange('efficiency', e.target.value)}
              />
            </Field>

            <Field id="area_m2" label="Área (m²)" required error={fieldErrors.area_m2}>
              <input
                id="area_m2"
                type="number"
                step="0.001"
                min="0"
                className={`field__input ${fieldErrors.area_m2 ? 'field__input--error' : ''}`}
                placeholder="Ex: 2.5"
                value={formData.area_m2}
                onChange={(e) => handleChange('area_m2', e.target.value)}
              />
            </Field>

            <Field id="quantity" label="Quantidade" required error={fieldErrors.quantity}>
              <input
                id="quantity"
                type="number"
                step="1"
                min="1"
                className={`field__input ${fieldErrors.quantity ? 'field__input--error' : ''}`}
                placeholder="Ex: 10"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
              />
            </Field>
          </div>

          {/* Live preview */}
          {formData.power_wp !== '' && formData.quantity !== '' &&
           Number(formData.power_wp) > 0 && Number(formData.quantity) > 0 && (
            <div className="module-form__preview">
              <span className="module-form__preview-label">Potência total do sistema:</span>
              <span className="module-form__preview-value">
                {(Number(formData.power_wp) * Number(formData.quantity)).toFixed(0)} Wp
                <small> ({(Number(formData.power_wp) * Number(formData.quantity) / 1000).toFixed(2)} kWp)</small>
              </span>
            </div>
          )}
        </section>

        <div className="module-form__actions">
          <Link to="/modules" className="btn btn--outline">
            Cancelar
          </Link>
          <button
            type="submit"
            id="submit-module-btn"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting
              ? 'Salvando…'
              : isEditing
                ? 'Atualizar Módulo'
                : 'Cadastrar Módulo'}
          </button>
        </div>
      </form>
    </div>
  )
}
