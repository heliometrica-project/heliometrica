import { useState } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './RootLayout.css'

export function RootLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isHome = location.pathname === '/'
  const isDashboard = location.pathname === '/dashboard'
  const isAuth = location.pathname === '/login' || location.pathname === '/register'
  const isWide = isDashboard || location.pathname === '/history'

  function isActive(path: string) {
    if (path === '/') return isHome
    return location.pathname.startsWith(path)
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  // Nav links for authenticated users
  const appNavLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/modules', label: 'Módulos' },
    { to: '/history', label: 'Histórico' },
  ]

  // Nav links for the public landing page
  const landingNavLinks = [
    { to: '/#funcionalidades', label: 'Funcionalidades', anchor: true },
    { to: '/#como-funciona', label: 'Como funciona', anchor: true },
    { to: '/#planos', label: 'Planos', anchor: true },
  ]

  return (
    <div className="root-layout">
      <header className={`root-header ${isHome ? 'root-header--landing' : ''}`}>
        <div className="root-header__container">
          {/* Brand */}
          <Link to={user ? '/dashboard' : '/'} className="root-header__brand">
            <div className="root-header__logo">
              <span>☀</span>
            </div>
            <span className="root-header__title">Heliométrica</span>
          </Link>

          {/* Desktop nav */}
          <nav className="root-header__nav" aria-label="Navegação principal">
            {user ? (
              appNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`root-header__link ${isActive(link.to) ? 'root-header__link--active' : ''}`}
                >
                  {link.label}
                </Link>
              ))
            ) : isHome ? (
              landingNavLinks.map((link) => (
                <a
                  key={link.to}
                  href={link.to}
                  className="root-header__link"
                  onClick={(e) => {
                    e.preventDefault()
                    const id = link.to.replace('/#', '')
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {link.label}
                </a>
              ))
            ) : null}
          </nav>

          {/* Desktop end actions */}
          <div className="root-header__end">
            {user ? (
              <>
                <span className="root-header__user">
                  <span className="root-header__user-avatar">{user.username[0].toUpperCase()}</span>
                  <span className="root-header__user-name hide-mobile">{user.username}</span>
                </span>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="root-header__logout"
                  aria-label="Sair"
                >
                  Sair
                </button>
              </>
            ) : isHome ? (
              <>
                <Link to="/login" className="root-header__link">
                  Entrar
                </Link>
                <Link to="/register" className="root-header__cta" id="nav-register-btn">
                  Começar grátis
                </Link>
              </>
            ) : !isAuth ? (
              <Link to="/login" className="root-header__cta">
                Entrar
              </Link>
            ) : null}

            {/* Mobile hamburger */}
            <button
              className="root-header__hamburger hide-desktop"
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className={`hamburger-icon ${mobileOpen ? 'hamburger-icon--open' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <nav className="root-header__mobile-nav" aria-label="Navegação mobile">
            {user ? (
              appNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`root-header__mobile-link ${isActive(link.to) ? 'root-header__mobile-link--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))
            ) : isHome ? (
              landingNavLinks.map((link) => (
                <a
                  key={link.to}
                  href={link.to}
                  className="root-header__mobile-link"
                  onClick={(e) => {
                    e.preventDefault()
                    setMobileOpen(false)
                    const id = link.to.replace('/#', '')
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {link.label}
                </a>
              ))
            ) : null}

            {!user && (
              <>
                <Link
                  to="/login"
                  className="root-header__mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="root-header__mobile-link root-header__mobile-link--cta"
                  onClick={() => setMobileOpen(false)}
                >
                  Começar gratuitamente
                </Link>
              </>
            )}

            {user && (
              <button
                className="root-header__mobile-link root-header__mobile-link--btn"
                onClick={() => { handleLogout(); setMobileOpen(false) }}
              >
                Sair
              </button>
            )}
          </nav>
        )}
      </header>

      <main className={`root-main ${isWide ? 'root-main--wide' : ''} ${isHome ? 'root-main--home' : ''}`}>
        <Outlet />
      </main>

      {/* Footer — full landing footer on home, minimal elsewhere */}
      {isHome ? (
        <footer className="root-footer root-footer--landing">
          <div className="root-footer__landing-container">
            <div className="root-footer__landing-brand">
              <div className="root-header__logo" style={{ width: 28, height: 28, fontSize: '0.875rem' }}>☀</div>
              <span className="root-header__title">Heliométrica</span>
            </div>
            <p className="root-footer__landing-desc">
              Plataforma brasileira para análise e estimativa de geração de energia fotovoltaica.
            </p>
            <div className="root-footer__landing-links">
              <a href="#funcionalidades" className="root-footer__landing-link"
                onClick={(e) => { e.preventDefault(); document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' }) }}>
                Funcionalidades
              </a>
              <a href="#como-funciona" className="root-footer__landing-link"
                onClick={(e) => { e.preventDefault(); document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' }) }}>
                Como funciona
              </a>
              <a href="#planos" className="root-footer__landing-link"
                onClick={(e) => { e.preventDefault(); document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }) }}>
                Planos
              </a>
              <Link to="/register" className="root-footer__landing-link">Cadastro</Link>
              <Link to="/login" className="root-footer__landing-link">Login</Link>
            </div>
            <p className="root-footer__landing-copy">
              © {new Date().getFullYear()} Heliométrica. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      ) : (
        <footer className="root-footer">
          <div className="root-footer__container">
            <span className="root-footer__brand">Heliométrica</span>
            <span className="root-footer__sep">—</span>
            <span>Sistema de apoio à medição e análise de eficiência de energia solar</span>
          </div>
        </footer>
      )}
    </div>
  )
}
