import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CompareResponse } from '../types'
import './CompareChart.css'

interface CompareChartProps {
  data: CompareResponse
}

const METRIC_COLORS: Record<string, string> = {
  daily_kwh: '#d97706',
  monthly_kwh: '#059669',
  yearly_kwh: '#2563eb',
}

const METRIC_LABELS: Record<string, string> = {
  daily_kwh: 'Diário (kWh)',
  monthly_kwh: 'Mensal (kWh)',
  yearly_kwh: 'Anual (kWh)',
}

export function CompareChart({ data }: CompareChartProps) {
  const chartData = data.chart.labels.map((label, i) => {
    const entry: Record<string, string | number | null> = { region: label }
    for (const dataset of data.chart.datasets) {
      entry[dataset.key] = dataset.data[i]
    }
    return entry
  })

  return (
    <div className="compare-chart">
      <h3 className="compare-chart__title">Comparação de Geração de Energia</h3>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="region"
            tick={{ fontSize: 13, fill: '#78716c' }}
            axisLine={{ stroke: '#e7e5e4' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#78716c' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e7e5e4',
              borderRadius: 6,
              fontSize: 13,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
          />
          {data.chart.datasets.map((dataset) => (
            <Bar
              key={dataset.key}
              dataKey={dataset.key}
              name={METRIC_LABELS[dataset.key] || dataset.label}
              fill={METRIC_COLORS[dataset.key] || '#d97706'}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="compare-chart__table-wrapper">
        <table className="compare-chart__table">
          <thead>
            <tr>
              <th>Região</th>
              <th>Diário (kWh)</th>
              <th>Mensal (kWh)</th>
              <th>Anual (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {data.series.map((s) => (
              <tr key={s.region_id}>
                <td className="compare-chart__region">
                  {s.region_name} <span className="compare-chart__region-state">{s.region_state}</span>
                </td>
                <td>{s.daily_kwh ?? '—'}</td>
                <td>{s.monthly_kwh ?? '—'}</td>
                <td>{s.yearly_kwh ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
