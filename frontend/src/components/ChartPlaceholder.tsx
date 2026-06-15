import './ChartPlaceholder.css'

const bars = Array.from({ length: 24 }, () => Math.random() * 140 + 20)

const labels = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export function ChartPlaceholder() {
  return (
    <div className="chart-placeholder">
      <h3 className="chart-placeholder__title">Irradiação Solar (kWh/m²)</h3>
      <div className="chart-placeholder__canvas">
        <div className="chart-placeholder__bars">
          {bars.slice(0, 12).map((h, i) => (
            <div
              key={i}
              className="chart-placeholder__bar"
              style={{ height: `${Math.max(6, h)}px` }}
            />
          ))}
        </div>
        <div className="chart-placeholder__axis">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
      <p className="chart-placeholder__hint">
        Gráfico ilustrativo — integração com dados reais em breve
      </p>
    </div>
  )
}
