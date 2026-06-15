import { useEffect, useState } from 'react'
import { apiClient } from '../api'
import './Home.css'

interface HealthResponse {
  status: string
}

export function Home() {
  const [health, setHealth] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get<HealthResponse>('/health/')
      .then((data) => setHealth(data.status))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="home">
      <section className="home__hero">
        <h2 className="home__title">Bem-vindo ao Heliométrica</h2>
        <p className="home__subtitle">
          Sistema de apoio à medição e análise de eficiência de energia solar
        </p>
      </section>

      <section className="home__status">
        <h3>Status da API</h3>
        {error && <p className="home__error">Erro ao conectar: {error}</p>}
        {health && <p className="home__ok">API conectada — status: {health}</p>}
        {!health && !error && <p className="home__loading">Conectando à API...</p>}
      </section>
    </div>
  )
}
