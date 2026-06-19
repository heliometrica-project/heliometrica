import { Outlet, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './RootLayout.css'

export function RootLayout() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const isDashboard = location.pathname === '/dashboard'
  const isModules = location.pathname.startsWith('/modules')
  const isAuth = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="root-layout">
      <header className="root-header">
        <div className="root-header__container">
          <Link to="/" className="root-header__brand">
            <div className="root-header__logo">H</div>
            <span className="root-header__title">Heliométrica</span>
          </Link>
          <nav className="root-header__nav">
            <Link
              to="/"
              className={`root-header__link ${location.pathname === '/' ? 'root-header__link--active' : ''}`}
            >
              Início
            </Link>
            <Link
              to="/dashboard"
              className={`root-header__link ${isDashboard ? 'root-header__link--active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/modules"
              className={`root-header__link ${isModules ? 'root-header__link--active' : ''}`}
            >
              Módulos
            </Link>
            {user ? (
              <>
                <span className="root-header__user">{user.username}</span>
                <button
                  onClick={logout}
                  className="root-header__link root-header__link--btn"
                >
                  Sair
                </button>
              </>
            ) : (
              !isAuth && (
                <Link
                  to="/login"
                  className="root-header__link root-header__link--btn"
                >
                  Entrar
                </Link>
              )
            )}
          </nav>
        </div>
      </header>

      <main className={`root-main ${isDashboard ? 'root-main--full' : ''}`}>
        <Outlet />
      </main>

      <footer className="root-footer">
        <div className="root-footer__container">
          Heliométrica &mdash; Sistema de apoio à medição e análise de eficiência de energia solar
        </div>
      </footer>
    </div>
  )
}
