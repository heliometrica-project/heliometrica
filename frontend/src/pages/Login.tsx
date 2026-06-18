import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('Informe o nome de usuário.')
      return
    }
    if (!password) {
      setError('Informe a senha.')
      return
    }

    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__header">
          <div className="auth__logo">H</div>
          <h1 className="auth__title">Entrar</h1>
          <p className="auth__subtitle">Acesse sua conta Heliométrica</p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <div className="auth__error">{error}</div>}

          <div className="auth__field">
            <label htmlFor="username" className="auth__label">Usuário</label>
            <input
              id="username"
              type="text"
              className="auth__input"
              placeholder="Seu nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="auth__field">
            <label htmlFor="password" className="auth__label">Senha</label>
            <input
              id="password"
              type="password"
              className="auth__input"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth__button" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth__footer">
          Não tem conta?{' '}
          <Link to="/register" className="auth__link">Cadastre-se</Link>
        </p>
      </div>
    </div>
  )
}
