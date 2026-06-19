# Heliométrica

Sistema de apoio à medição e análise de eficiência de energia solar.

## Visão Geral do MVP

O Heliométrica é uma plataforma web para monitoramento e análise de desempenho de sistemas fotovoltaicos. O MVP contempla:

- **Dashboard** com visão geral de regiões e geração de energia
- **Estimativas de produção** baseadas em dados meteorológicos e geolocalização
- **Histórico de medições** com CRUD de geração energética, dados de módulo e região para relatórios
- **Cadastro de módulos solares** (painéis) com especificações técnicas (modelo, fabricante, potência, eficiência, área, quantidade) — via admin; API prevista
- **Consulta de regiões** (municípios georreferenciados) — somente leitura via API, seed inicial via comando
- **API REST** para integração futura com sensores e inversores

### Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Backend | Django 4.2 + Django REST Framework |
| Frontend | React 18 + TypeScript + Vite |
| Banco de Dados | SQLite (dev) / PostgreSQL (produção prevista) |
| Deploy | Docker + Docker Compose (previsto) |

## Estrutura do Projeto

```
heliometrica/
├── backend/          # Django API
│   ├── apps/
│   │   ├── core/         # Region (read-only API), SolarModule (model+admin)
│   │   ├── accounts/     # Autenticação/usuários
│   │   ├── estimates/    # EnergyEstimate, WeatherSnapshot
│   │   ├── reporting/    # GenerationHistory, ReportExport (CRUD + exportação)
│   │   └── health/       # Health check
│   └── config/       # Settings, URLs, WSGI
├── frontend/         # React + Vite
│   ├── src/          # Componentes, páginas, hooks, API client
│   └── public/       # Assets estáticos
└── docs/             # Documentação centralizada
    ├── requisitos/   # Requisitos do sistema (PDF)
    ├── modelagem/    # Diagramas UML, protótipos, modelagem de dados
    ├── deploy/       # Guias de deploy, infraestrutura, CI/CD
    └── testes/       # Estratégia, planos e evidências de testes
```

## Integrantes do Projeto

| Papel | Nome | Responsabilidade |
|-------|------|------------------|
| PO | Adrian | Priorização, validação de aceite, decisões de produto |
| Tech Lead | Adrian | Arquitetura, code review, decisões técnicas |
| Dev Backend | Erick, Daniel | API, modelos, integrações, testes backend |
| Dev Frontend | Kaue, Adrian | UI, componentes, estado, integração API |
| QA | Daniel, Kaue | Testes, automação, validação de aceite |
| Modelagem/Deploy | Jean, Daniel | Diagramas UML, relatório, deploy, infraestrutura |

> **Nota:** Conforme distribuição do Plano Técnico (seção 14).

## Regras de Branches e Fluxo de Trabalho

### Nomenclatura de Branches
- `feat/<id>-<descricao>` — novas funcionalidades
- `fix/<id>-<descricao>` — correções de bugs
- `docs/<id>-<descricao>` — documentação
- `refactor/<id>-<descricao>` — refatoração sem mudança de comportamento
- `chore/<id>-<descricao>` — tarefas de manutenção, configs, dependencies

### Fluxo Obrigatório
1. Atualize `main` local antes de iniciar: `git pull origin main`
2. Crie branch seguindo o padrão da issue
3. Implemente **apenas** o escopo da issue
4. Abra PR para `main` usando o template (`.github/pull_request_template.md`)
5. Registre evidência simples de validação no PR (print, log, comando)
6. Aguarde aprovação do **PO** — merge só com aval do PO

### Proteção da `main`
- Push direto na `main` **não é permitido**
- Branch `main` deve permanece protegida (branch protection rules no GitHub)
- Merge apenas via Pull Request aprovado

## Como Rodar Localmente

### Backend

```bash
# 1. Clonar e entrar no diretório
git clone <repo-url>
cd heliometrica

# 2. Criar e ativar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate

# 3. Instalar dependências
pip install -r backend/requirements.txt

# 4. Configurar variáveis de ambiente
cp backend/.env.example backend/.env

# 5. Executar migrations
python backend/manage.py migrate

# 6. Iniciar servidor
python backend/manage.py runserver

# 7. Verificar health check
curl http://localhost:8000/api/health/
```

### Frontend

```bash
# 1. Instalar dependências
cd frontend
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

O frontend será iniciado em `http://localhost:3000`.

## Ferramentas de Qualidade

### Backend (ruff)

```bash
# Ativar ambiente virtual (se não estiver ativo)
source .venv/bin/activate

# Verificar lint
ruff check backend/

# Aplicar correções automáticas
ruff check --fix backend/

# Verificar formatação
ruff format --check backend/

# Aplicar formatação
ruff format backend/
```

### Frontend (ESLint)

```bash
cd frontend

# Verificar lint
npm run lint

# Aplicar correções automáticas
npm run lint:fix
```

## Documentação Disponível

| Documento | Localização | Descrição |
|-----------|-------------|-----------|
| Requisitos do Sistema | `docs/requisitos/requisitos-do-sistema.pdf` | Especificação funcional e não-funcional |
| Protótipo Baixa Fidelidade | `docs/modelagem/prototipo-baixa-fidelidade.pdf` | Wireframes e fluxos de tela |
| Diagramas UML (Unidade 01) | `docs/modelagem/unidade01/` | Casos de uso, modelo de classes análise |
| Diagramas UML (Unidade 02) | `docs/modelagem/unidade02/` | Sequências, atividades, modelo de classes projeto |
| Deploy (previsto) | `docs/deploy/` | Guias de infra, Docker, CI/CD |
| Testes (previsto) | `docs/testes/` | Estratégia, planos, evidências |
| Regiões (seed) | `backend/apps/core/management/commands/seed_regions.py` | Municípios RN/CE (Alto Oeste Potiguar) |
| Módulos Solares (model) | `backend/apps/core/models.py:66` | SolarModule — cadastro de painéis (admin); API prevista |
| Histórico de Geração (model) | `backend/apps/reporting/models.py:17` | GenerationHistory — registro nomeado de estimativas |
| Exportação de Relatórios (model) | `backend/apps/reporting/models.py:65` | ReportExport — metadados de exportações CSV/PDF |

## Convenções de Commit

Este projeto adota [Conventional Commits](https://www.conventionalcommits.org/).

Exemplos:
- `feat: adiciona endpoint de estimativa por região`
- `fix: corrige cálculo de irradiação no serializer`
- `docs: atualiza README com stack do MVP`
- `refactor: extrai lógica de validação para service`