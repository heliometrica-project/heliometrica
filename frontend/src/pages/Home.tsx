import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

// ─── Data ─────────────────────────────────────────────

const features = [
  {
    icon: '🗺️',
    title: 'Mapa Interativo',
    desc: 'Clique em qualquer ponto do Brasil e obtenha dados climáticos e de irradiação solar em tempo real, direto da API Open-Meteo.',
  },
  {
    icon: '⚡',
    title: 'Estimativas Instantâneas',
    desc: 'Calcule produção diária, mensal e anual do seu sistema FV em segundos, com base em dados meteorológicos reais da sua região.',
  },
  {
    icon: '📊',
    title: 'Histórico & Relatórios',
    desc: 'Salve, pesquise e compare estimativas ilimitadas. Exporte relatórios em CSV para análise em planilhas externas.',
  },
  {
    icon: '☀️',
    title: 'Módulos Configuráveis',
    desc: 'Cadastre seus painéis com especificações técnicas reais (Wp, eficiência, área) e use-os em qualquer cálculo.',
  },
  {
    icon: '🔍',
    title: 'Comparação de Regiões',
    desc: 'Compare o potencial solar entre múltiplas localidades para encontrar o local ideal para sua instalação.',
  },
  {
    icon: '📐',
    title: 'Cálculo com Perdas',
    desc: 'Performance Ratio (PR) configurável que considera perdas sistêmicas reais: cabeamento, temperatura e inversores.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Cadastre seu módulo',
    desc: 'Informe as especificações técnicas do seu painel solar: fabricante, modelo, potência e eficiência.',
    icon: '☀️',
  },
  {
    number: '02',
    title: 'Selecione a localidade',
    desc: 'Clique no mapa interativo ou pesquise pelo nome da cidade. Escolha dentre milhares de municípios mapeados.',
    icon: '📍',
  },
  {
    number: '03',
    title: 'Calcule a estimativa',
    desc: 'Em segundos, receba a produção diária, mensal e anual estimada com dados climáticos reais da região.',
    icon: '⚡',
  },
  {
    number: '04',
    title: 'Salve e exporte',
    desc: 'Guarde suas estimativas no histórico, compare resultados e exporte relatórios em CSV para análise.',
    icon: '📊',
  },
]

const stats = [
  { value: '27', unit: 'estados', label: 'Cobertura nacional' },
  { value: '5.500+', unit: 'municípios', label: 'Regiões mapeadas' },
  { value: '24h', unit: 'atuais', label: 'Dados meteorológicos' },
  { value: '100%', unit: 'gratuito', label: 'Sem custos ocultos' },
]

const plans = [
  {
    name: 'Básico',
    price: 'R$ 0',
    period: 'para sempre',
    highlight: false,
    badge: null,
    description: 'Ideal para estudantes, técnicos e profissionais que estão começando a explorar o potencial solar.',
    features: [
      'Até 3 módulos solares',
      'Até 10 estimativas/mês',
      'Histórico dos últimos 30 dias',
      'Mapa interativo',
      'Exportação CSV',
      'Suporte por e-mail',
    ],
    cta: 'Começar gratuitamente',
    ctaLink: '/register',
  },
  {
    name: 'Pro',
    price: 'R$ 49',
    period: 'mês',
    highlight: true,
    badge: 'Mais popular',
    description: 'Para engenheiros e empresas que precisam de análises avançadas, relatórios e integrações.',
    features: [
      'Módulos solares ilimitados',
      'Estimativas ilimitadas',
      'Histórico completo e permanente',
      'Comparação avançada de regiões',
      'Relatórios em PDF',
      'API de integração',
      'Dashboard analítico',
      'Suporte prioritário',
    ],
    cta: 'Começar agora',
    ctaLink: '/register',
  },
]

const testimonials = [
  {
    text: 'O Heliométrica reduziu de horas para minutos o tempo que levamos para estimar a viabilidade de projetos fotovoltaicos. Ferramenta indispensável.',
    name: 'Carlos Mendonça',
    role: 'Engenheiro Eletricista',
    avatar: 'C',
  },
  {
    text: 'Finalmente uma plataforma brasileira focada em energia solar. Os dados climáticos regionais fazem toda a diferença na precisão dos cálculos.',
    name: 'Ana Paula Ribeiro',
    role: 'Consultora em Energias Renováveis',
    avatar: 'A',
  },
  {
    text: 'Usamos o Heliométrica para pré-dimensionar sistemas residenciais. A exportação CSV se integra perfeitamente ao nosso fluxo de trabalho.',
    name: 'Rafael Costa',
    role: 'Técnico em Instalações Solares',
    avatar: 'R',
  },
]

// ─── Component ────────────────────────────────────────

export function Home() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) return null

  return (
    <div className="lp">

      {/* ══════════ HERO ══════════ */}
      <section className="lp__hero" aria-label="Apresentação">
        {/* Decorative orbs */}
        <div className="lp__orb lp__orb--1" aria-hidden="true" />
        <div className="lp__orb lp__orb--2" aria-hidden="true" />
        <div className="lp__orb lp__orb--3" aria-hidden="true" />

        <div className="lp__hero-inner">
          <div className="lp__hero-badge">
            <span className="lp__hero-badge-dot" />
            Plataforma Solar Brasileira
          </div>

          <h1 className="lp__hero-title">
            Calcule o potencial solar
            <br />
            <span className="lp__hero-gradient">de qualquer região</span>
            <br />
            do Brasil
          </h1>

          <p className="lp__hero-subtitle">
            Heliométrica é a plataforma para engenheiros e profissionais de energia solar estimarem
            a produção fotovoltaica com dados climáticos reais, mapa interativo e relatórios completos.
          </p>

          <div className="lp__hero-actions">
            <Link to="/register" id="hero-cta-register" className="lp__btn lp__btn--primary">
              <span>☀</span>
              Começar gratuitamente
            </Link>
            <Link to="/login" className="lp__btn lp__btn--ghost">
              Já tenho conta →
            </Link>
          </div>


        </div>

        {/* Hero visual card */}
        <div className="lp__hero-visual" aria-hidden="true">
          <div className="lp__mockup">
            <div className="lp__mockup-bar">
              <span /><span /><span />
            </div>
            <div className="lp__mockup-body">
              <div className="lp__mockup-label">Estimativa — Mossoró, RN</div>
              <div className="lp__mockup-metrics">
                <div className="lp__mockup-metric lp__mockup-metric--gold">
                  <span className="lp__mockup-metric-val">18,4</span>
                  <span className="lp__mockup-metric-unit">kWh/dia</span>
                  <span className="lp__mockup-metric-label">Produção diária</span>
                </div>
                <div className="lp__mockup-metric">
                  <span className="lp__mockup-metric-val">552</span>
                  <span className="lp__mockup-metric-unit">kWh/mês</span>
                  <span className="lp__mockup-metric-label">Produção mensal</span>
                </div>
                <div className="lp__mockup-metric">
                  <span className="lp__mockup-metric-val">6.624</span>
                  <span className="lp__mockup-metric-unit">kWh/ano</span>
                  <span className="lp__mockup-metric-label">Produção anual</span>
                </div>
                <div className="lp__mockup-metric">
                  <span className="lp__mockup-metric-val">84,2%</span>
                  <span className="lp__mockup-metric-unit">PR</span>
                  <span className="lp__mockup-metric-label">Eficiência</span>
                </div>
              </div>
              <div className="lp__mockup-chart" aria-label="Gráfico de produção">
                {[55, 72, 68, 90, 85, 95, 80, 92, 88, 76, 60, 65].map((h, i) => (
                  <div
                    key={i}
                    className="lp__mockup-bar-item"
                    style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </div>
              <div className="lp__mockup-footer">
                <span className="lp__mockup-module">Canadian Solar · RS-540M10 · 10 un.</span>
                <span className="lp__mockup-tag">✓ Salvo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="lp__stats" aria-label="Estatísticas">
        <div className="lp__container">
          <div className="lp__stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="lp__stat">
                <div className="lp__stat-value">
                  {s.value}
                  <span className="lp__stat-unit">{s.unit}</span>
                </div>
                <div className="lp__stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section className="lp__features" id="funcionalidades" aria-label="Funcionalidades">
        <div className="lp__container">
          <div className="lp__section-head">
            <div className="lp__section-eyebrow">Funcionalidades</div>
            <h2 className="lp__section-title">
              Tudo que você precisa para analisar
              <br />
              projetos fotovoltaicos
            </h2>
            <p className="lp__section-sub">
              Do dimensionamento à exportação de relatórios, o Heliométrica cobre todo o fluxo
              de análise de viabilidade solar.
            </p>
          </div>

          <div className="lp__features-grid">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="lp__feature-card"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="lp__feature-icon">{f.icon}</div>
                <h3 className="lp__feature-title">{f.title}</h3>
                <p className="lp__feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="lp__how" id="como-funciona" aria-label="Como funciona">
        <div className="lp__container">
          <div className="lp__section-head">
            <div className="lp__section-eyebrow">Como funciona</div>
            <h2 className="lp__section-title">
              Da seleção do local ao relatório
              <br />
              em menos de 2 minutos
            </h2>
          </div>

          <div className="lp__steps">
            {steps.map((s, i) => (
              <div key={s.number} className="lp__step" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="lp__step-number">{s.number}</div>
                <div className="lp__step-icon">{s.icon}</div>
                <h3 className="lp__step-title">{s.title}</h3>
                <p className="lp__step-desc">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="lp__step-connector" aria-hidden="true">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════ PRICING ══════════ */}
      <section className="lp__pricing" id="planos" aria-label="Planos e preços">
        <div className="lp__container">
          <div className="lp__section-head">
            <div className="lp__section-eyebrow">Planos</div>
            <h2 className="lp__section-title">Escolha o plano ideal</h2>
            <p className="lp__section-sub">
              Comece de graça e evolua conforme a necessidade. Sem surpresas na cobrança.
            </p>
          </div>

          <div className="lp__plans">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`lp__plan ${plan.highlight ? 'lp__plan--highlight' : ''}`}
              >
                {plan.badge && (
                  <div className="lp__plan-badge">{plan.badge}</div>
                )}
                <div className="lp__plan-header">
                  <div className="lp__plan-name">{plan.name}</div>
                  <div className="lp__plan-price">
                    {plan.price}
                    {plan.period && (
                      <span className="lp__plan-period"> / {plan.period}</span>
                    )}
                  </div>
                  <p className="lp__plan-desc">{plan.description}</p>
                </div>

                <ul className="lp__plan-features">
                  {plan.features.map((f) => (
                    <li key={f} className="lp__plan-feature">
                      <span className="lp__plan-check" aria-hidden="true">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.ctaLink}
                  id={`plan-cta-${plan.name.toLowerCase()}`}
                  className={`lp__plan-cta ${plan.highlight ? 'lp__btn lp__btn--outline-white' : 'lp__btn lp__btn--primary'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="lp__final-cta" aria-label="Chamada final para ação">
        <div className="lp__container">
          <div className="lp__final-cta-card">
            <div className="lp__final-cta-orb" aria-hidden="true" />
            <div className="lp__final-cta-inner">
              <div className="lp__section-eyebrow lp__section-eyebrow--light">
                Comece hoje
              </div>
              <h2 className="lp__final-cta-title">
                Pronto para calcular o potencial
                <br />
                solar da sua região?
              </h2>
              <p className="lp__final-cta-sub">
                Crie sua conta gratuita em menos de 30 segundos.
                Sem cartão de crédito necessário.
              </p>
              <div className="lp__hero-actions" style={{ justifyContent: 'center' }}>
                <Link to="/register" id="final-cta-register" className="lp__btn lp__btn--white">
                  <span>☀</span>
                  Criar conta gratuita
                </Link>
                <Link to="/login" className="lp__btn lp__btn--ghost-light">
                  Fazer login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
