import { Link } from 'react-router-dom'
import './Home.css'

const features = [
  { icon: '☀️', title: 'Mapa Interativo', desc: 'Navegue pelo mapa e selecione localidades para análise solar.' },
  { icon: '📊', title: 'Dados Solares', desc: 'Visualize métricas de irradiação e eficiência energética.' },
  { icon: '🔍', title: 'Pesquisa Rápida', desc: 'Encontre rapidamente qualquer região pelo nome ou coordenadas.' },
]

export function Home() {
  return (
    <div className="home">
      <div className="home__hero">
        <span className="home__badge">Sistema de Análise Solar</span>
        <h1 className="home__title">
          Medição e Análise de<br />Eficiência Solar
        </h1>
        <p className="home__subtitle">
          Plataforma para análise de dados de irradiação solar e eficiência energética
          em diferentes regiões.
        </p>
        <div className="home__actions">
          <Link to="/dashboard" className="home__btn home__btn--primary">
            Acessar Dashboard
          </Link>
        </div>
      </div>

      <div className="home__features">
        {features.map((f) => (
          <div key={f.title} className="home__feature">
            <div className="home__feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
