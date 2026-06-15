import { Outlet } from 'react-router-dom'
import './RootLayout.css'

export function RootLayout() {
  return (
    <div className="root-layout">
      <header className="root-header">
        <div className="root-header__container">
          <h1 className="root-header__title">Heliométrica</h1>
          <nav className="root-header__nav">
            <a href="/" className="root-header__link">Início</a>
          </nav>
        </div>
      </header>

      <main className="root-main">
        <Outlet />
      </main>

      <footer className="root-footer">
        <div className="root-footer__container">
          <p>Heliométrica &mdash; Sistema de apoio à medição e análise de eficiência de energia solar</p>
        </div>
      </footer>
    </div>
  )
}
