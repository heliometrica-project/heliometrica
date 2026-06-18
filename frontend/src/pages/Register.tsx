import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('Informe o nome de usuário.')
      return
    }
    if (!email.trim()) {
      setError('Informe o email.')
      return
    }
    if (!password) {
      setError('Informe a senha.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    setSubmitting(true)
    try {
      await register(username, email, password, confirmPassword)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__header">
          <div className="auth__logo">H</div>
          <h1 className="auth__title">Criar Conta</h1>
          <p className="auth__subtitle">Cadastre-se no Heliométrica</p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <div className="auth__error">{error}</div>}

          <div className="auth__field">
            <label htmlFor="reg-username" className="auth__label">Usuário</label>
            <input
              id="reg-username"
              type="text"
              className="auth__input"
              placeholder="Seu nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="auth__field">
            <label htmlFor="reg-email" className="auth__label">Email</label>
            <input
              id="reg-email"
              type="email"
              className="auth__input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth__field">
            <label htmlFor="reg-password" className="auth__label">Senha</label>
            <input
              id="reg-password"
              type="password"
              className="auth__input"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="auth__field">
            <label htmlFor="reg-confirm" className="auth__label">Confirmar Senha</label>
            <input
              id="reg-confirm"
              type="password"
              className="auth__input"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth__button" disabled={submitting}>
            {submitting ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="auth__footer">
          Já tem conta?{' '}
          <Link to="/login" className="auth__link">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
