# Heliométrica — Backend

API REST do sistema de estimativa de eficiência de energia solar, construída com **Django 5.1** e **Django REST Framework**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Django 5.1 |
| API | Django REST Framework 3.15 |
| Autenticação | SimpleJWT |
| Banco de dados | SQLite (desenvolvimento) |
| CORS | django-cors-headers |
| Configuração | python-decouple |

---

## Estrutura de pastas

```
backend/
├── config/                  # Configuração do projeto Django
│   ├── settings/
│   │   ├── base.py          # Settings compartilhados
│   │   ├── development.py   # Overrides de desenvolvimento
│   │   └── production.py    # Overrides de produção
│   ├── urls.py              # Roteamento raiz
│   └── wsgi.py
│
├── apps/
│   ├── health/              # Endpoint de saúde da API
│   │
│   ├── core/                # Entidades de referência do domínio
│   │   ├── models.py        # Region, SolarModule
│   │   ├── admin.py
│   │   ├── tests.py
│   │   └── management/
│   │       └── commands/
│   │           └── seed_regions.py   # Fixture inicial de municípios do RN
│   │
│   ├── estimates/           # Coração do domínio de estimativa solar
│   │   ├── models.py        # WeatherSnapshot, EnergyEstimate
│   │   ├── admin.py
│   │   └── tests.py
│   │
│   ├── regions/              # API pública de regiões (read-only)
│   │   ├── serializers.py   # RegionSerializer
│   │   ├── views.py         # RegionViewSet
│   │   ├── urls.py          # /api/regions/
│   │   └── tests.py         # 12 testes
│   │
│   └── reporting/           # Camada de saída e histórico
│       ├── models.py        # GenerationHistory, ReportExport
│       ├── admin.py
│       └── tests.py
│
├── manage.py
├── requirements.txt
├── .env.example
└── README.md                # este arquivo
```

---

## Setup local

### Pré-requisitos

- Python 3.11+
- `pip`

### 1. Clonar e entrar na pasta

```bash
git clone <repo-url>
cd heliometrica
```

### 2. Criar e ativar o ambiente virtual

```bash
python3 -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows
```

### 3. Instalar dependências

```bash
pip install -r backend/requirements.txt
```

### 4. Configurar variáveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` conforme necessário:

| Variável | Padrão | Descrição |
|---|---|---|
| `SECRET_KEY` | `change-me-...` | Chave secreta do Django — **troque em produção** |
| `DEBUG` | `True` | Ativar modo debug |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Hosts permitidos (separados por vírgula) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,...` | Origins do frontend (separadas por vírgula) |
| `WEATHER_API_BASE_URL` | `https://api.open-meteo.com/v1/forecast` | URL base da API meteorologica externa |
| `WEATHER_API_TIMEOUT_SECONDS` | `5` | Timeout da consulta meteorologica em segundos |

### 5. Aplicar migrações

```bash
cd backend
python manage.py migrate
```

### 6. Popular dados iniciais (regiões do RN)

```bash
python manage.py seed_regions
```

O comando é **idempotente** — pode ser executado múltiplas vezes sem duplicar dados.

### 7. Criar superusuário (opcional, para o Admin)

```bash
python manage.py createsuperuser
```

### 8. Iniciar o servidor de desenvolvimento

```bash
python manage.py runserver
```

A API estará disponível em `http://localhost:8000`.

---

## Endpoints disponíveis

| Método | URL | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Cadastro de usuario |
| `POST` | `/api/auth/login/` | Login com retorno de tokens `access` e `refresh` |
| `POST` | `/api/auth/refresh/` | Renovacao do token de acesso |
| `GET` | `/api/auth/me/` | Dados do usuario autenticado (exige Bearer token) |
| `GET` | `/api/health/` | Health check da API |
| `GET` | `/api/regions/` | Listar todas as regiões |
| `GET` | `/api/regions/{id}/` | Detalhe de uma região |
| `GET` | `/api/regions/?search=...` | Buscar regiões por nome ou estado |
| `GET` | `/api/modules/` | Listar módulos solares do usuário autenticado |
| `POST` | `/api/modules/` | Cadastrar novo módulo solar |
| `GET` | `/api/modules/{id}/` | Detalhe de um módulo solar |
| `PUT` | `/api/modules/{id}/` | Atualizar módulo solar (todos os campos) |
| `PATCH` | `/api/modules/{id}/` | Atualizar módulo solar (parcial) |
| `DELETE` | `/api/modules/{id}/` | Excluir módulo solar |
| `GET` | `/api/weather/?region_id={id}` | Consultar clima por coordenada da região e salvar snapshot |
| `POST` | `/api/estimates/` | Estimar produção energética (exige Bearer token). Payload: `{"region_id": 1, "module_id": 3}` |
| `POST` | `/api/estimates/compare/` | Comparar estimativas médias de duas ou mais regiões. Payload: `{"region_ids": [1, 2]}` |
| — | `/admin/` | Django Admin |

---

## Modelos de dados

### `core` — Entidades de referência

#### `Region`
Município ou localidade georreferenciada. Usada como âncora para consultas climáticas e estimativas.

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | `CharField(200)` | Nome do município |
| `state` | `CharField(2)` | Sigla do estado (ex: `"RN"`) |
| `latitude` | `DecimalField(9,6)` | Latitude em graus decimais (WGS 84) |
| `longitude` | `DecimalField(9,6)` | Longitude em graus decimais (WGS 84) |
| `source` | `CharField(100)` | Origem: `seed` ou `user`. Padrão: `seed` |
| `created_at` | `DateTimeField` | Preenchido automaticamente |

#### `SolarModule`
Painel solar cadastrado pelo usuário com especificações técnicas.

| Campo | Tipo | Descrição |
|---|---|---|
| `user` | `FK(User)` | Dono do registro (CASCADE) |
| `model` | `CharField(200)` | Identificação comercial |
| `manufacturer` | `CharField(200)` | Fabricante |
| `power_wp` | `DecimalField(8,2)` | Potência de pico em Wp |
| `efficiency` | `DecimalField(5,2)` | Eficiência de conversão em % |
| `area_m2` | `DecimalField(6,3)` | Área do painel em m² |
| `quantity` | `PositiveIntegerField` | Número de painéis. Padrão: `1` |
| `created_at` | `DateTimeField` | Preenchido automaticamente |

---

## Fórmula de Estimativa Energética

A estimativa de produção solar utiliza a seguinte fórmula:

### Potência Instalada

```
potencia_instalada_kW = (power_Wp × quantidade) / 1000
```

### Energia Diária

```
energia_dia_kWh = potencia_instalada_kW × irradiacao_kWh_m2_dia × PR
```

### Energia Mensal e Anual

```
energia_mes_kWh = energia_dia_kWh × 30
energia_ano_kWh = energia_dia_kWh × 365
```

### Performance Ratio (PR)

**PR = 0.80** (fixo para o MVP)

Representa as perdas típicas do sistema fotovoltaico:
- Inversor (conversão CC/CA)
- Cabeamento e conexões
- Sujeira e poluição dos painéis
- Orientação e inclinação não-ideal
- Temperatura média de operação

### Índice de Eficiência

O índice de eficiência armazenado é a própria eficiência do módulo solar cadastrada pelo usuário (campo `efficiency` do `SolarModule`). É retornado apenas para exibição e não influencia o cálculo no MVP.

### Exemplo Completo

**Entrada:**
- Módulo solar: 540 Wp, 4 unidades, eficiência 20.9%
- Irradiação solar: 5.35 kWh/m²/dia

**Cálculo:**

```
potencia_instalada = (540 × 4) / 1000 = 2.16 kW
energia_dia = 2.16 × 5.35 × 0.80 = 9.24 kWh/dia
energia_mes = 9.24 × 30 = 277.20 kWh/mês
energia_ano = 9.24 × 365 = 3372.60 kWh/ano
indice_eficiencia = 20.9%
```

---

### `estimates` — Estimativas de energia

#### `WeatherSnapshot`
Snapshot climático diário de uma região, obtido via Open-Meteo.

| Campo | Tipo | Descrição |
|---|---|---|
| `region` | `FK(Region)` | Região do snapshot (CASCADE) |
| `date` | `DateField` | Data do snapshot |
| `irradiation` | `DecimalField(7,3)` | Irradiação solar em kWh/m²/dia (nullable) |
| `temperature` | `DecimalField(5,2)` | Temperatura média em °C (nullable) |
| `cloud_cover` | `DecimalField(5,2)` | Cobertura de nuvens em % (nullable) |
| `source` | `CharField(100)` | Fonte dos dados. Padrão: `open-meteo` |
| `raw_json` | `JSONField` | Resposta bruta da API (nullable) |
| `status` | `CharField(20)` | `ok` \| `error` \| `cached`. Padrão: `ok` |
| `created_at` | `DateTimeField` | Preenchido automaticamente |

> Constraint: `unique_together = ('region', 'date')`

#### `EnergyEstimate`
Estimativa de geração de energia de um sistema fotovoltaico.

| Campo | Tipo | Descrição |
|---|---|---|
| `user` | `FK(User)` | Usuário que gerou a estimativa (CASCADE) |
| `region` | `FK(Region)` | Região da estimativa (CASCADE) |
| `module` | `FK(SolarModule)` | Módulo solar utilizado (SET_NULL, nullable) |
| `weather_snapshot` | `FK(WeatherSnapshot)` | Snapshot climático utilizado no cálculo (SET_NULL, nullable) |
| `daily_kwh` | `DecimalField(10,3)` | Geração diária estimada em kWh |
| `monthly_kwh` | `DecimalField(10,3)` | Projeção mensal em kWh |
| `yearly_kwh` | `DecimalField(10,3)` | Projeção anual em kWh |
| `efficiency_index` | `DecimalField(8,4)` | Performance Ratio (PR) do sistema |
| `losses_factor` | `DecimalField(4,2)` | Fator de perdas sistêmicas (0.0–1.0). Padrão: `0.80` |
| `created_at` | `DateTimeField` | Preenchido automaticamente |

---

### `reporting` — Histórico e exportações

#### `GenerationHistory`
Registro nomeado de uma estimativa salva pelo usuário.

| Campo | Tipo | Descrição |
|---|---|---|
| `user` | `FK(User)` | Dono do histórico (CASCADE) |
| `title` | `CharField(300)` | Título dado pelo usuário |
| `estimate` | `FK(EnergyEstimate)` | Estimativa vinculada (CASCADE) |
| `notes` | `TextField` | Anotações livres. Padrão: `""` |
| `updated_at` | `DateTimeField` | Atualizado automaticamente ao salvar |
| `created_at` | `DateTimeField` | Preenchido automaticamente |

#### `ReportExport`
Metadados de um relatório exportado (CSV ou PDF).

| Campo | Tipo | Descrição |
|---|---|---|
| `user` | `FK(User)` | Usuário que exportou (CASCADE) |
| `estimate` | `FK(EnergyEstimate)` | Estimativa origem (CASCADE) |
| `format` | `CharField(10)` | `csv` \| `pdf`. Padrão: `csv` |
| `generated_at` | `DateTimeField` | Preenchido automaticamente |
| `file_name` | `CharField(300)` | Nome do arquivo gerado (pode ser vazio) |

---

## Comandos úteis

```bash
# Aplicar migrações
python manage.py migrate

# Criar novas migrações após alterar models
python manage.py makemigrations

# Popular municípios do RN (idempotente)
python manage.py seed_regions

# Rodar todos os testes
python manage.py test

# Rodar testes de um app específico com saída detalhada
python manage.py test apps.core --verbosity=2
python manage.py test apps.estimates --verbosity=2
python manage.py test apps.reporting --verbosity=2

# Abrir o shell Django
python manage.py shell

# Verificar o banco SQLite diretamente
sqlite3 db.sqlite3 ".tables"
```

---

## Testes

A suite de testes cobre os 5 apps do backend:

| App | Classes de teste | Total de testes |
|---|---|---|
| `core` | `RegionModelTest`, `SolarModuleModelTest`, `RegionAPITest`, `SolarModuleAPITest` | 33 |
| `estimates` | `WeatherSnapshotModelTest`, `EnergyEstimateModelTest`, `EstimationServiceTest`, `EstimateAPITest` | 33 |
| `reporting` | `GenerationHistoryModelTest`, `ReportExportModelTest` | 15 |
| `health` | `HealthCheckTest` | 1 |
| `accounts` | `AuthApiTest` | 3 |
| **Total** | 13 | **94** |

Cenários cobertos: criação de instâncias, valores padrão, `__str__`, constraints (`unique_together`), campos nullable, comportamento de FKs (`CASCADE`, `SET_NULL`), timestamps automáticos, CRUD via API REST, busca textual, health check, e isolamento de dados entre usuários.

---

## Django Admin

Acesse `http://localhost:8000/admin/` após criar um superusuário. Todos os models estão registrados com filtros, busca e campos somente-leitura configurados.
