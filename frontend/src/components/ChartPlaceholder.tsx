import './ChartPlaceholder.css'

export function ChartPlaceholder() {
  return (
    <div className="chart-placeholder">
      <h3 className="chart-placeholder__title">Eficiência Energética</h3>
      <div className="chart-placeholder__canvas">
        <div className="chart-placeholder__bars">
          <div className="chart-placeholder__bar" style={{ height: '40%' }} />
          <div className="chart-placeholder__bar" style={{ height: '65%' }} />
          <div className="chart-placeholder__bar" style={{ height: '50%' }} />
          <div className="chart-placeholder__bar" style={{ height: '80%' }} />
          <div className="chart-placeholder__bar" style={{ height: '55%' }} />
          <div className="chart-placeholder__bar" style={{ height: '90%' }} />
          <div className="chart-placeholder__bar" style={{ height: '70%' }} />
          <div className="chart-placeholder__bar" style={{ height: '45%' }} />
          <div className="chart-placeholder__bar" style={{ height: '75%' }} />
          <div className="chart-placeholder__bar" style={{ height: '60%' }} />
          <div className="chart-placeholder__bar" style={{ height: '85%' }} />
          <div className="chart-placeholder__bar" style={{ height: '95%' }} />
        </div>
        <div className="chart-placeholder__axis">
          <span>Jan</span>
          <span>Fev</span>
          <span>Mar</span>
          <span>Abr</span>
          <span>Mai</span>
          <span>Jun</span>
          <span>Jul</span>
          <span>Ago</span>
          <span>Set</span>
          <span>Out</span>
          <span>Nov</span>
          <span>Dez</span>
        </div>
      </div>
      <p className="chart-placeholder__hint">
        Gráfico ilustrativo — dados reais serão integrados em versão futura.
      </p>
    </div>
  )
}
