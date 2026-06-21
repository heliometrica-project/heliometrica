import './MetricCard.css'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: string
  variant?: 'default' | 'primary' | 'accent' | 'info'
  description?: string
  animDelay?: number
}

export function MetricCard({
  label,
  value,
  unit,
  icon,
  variant = 'default',
  description,
  animDelay = 0,
}: MetricCardProps) {
  return (
    <div
      className={`metric-card metric-card--${variant}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {icon && <div className="metric-card__icon">{icon}</div>}
      <div className="metric-card__body">
        <p className="metric-card__label">{label}</p>
        <p className="metric-card__value">
          {value}
          {unit && <span className="metric-card__unit"> {unit}</span>}
        </p>
        {description && (
          <p className="metric-card__desc">{description}</p>
        )}
      </div>
    </div>
  )
}
