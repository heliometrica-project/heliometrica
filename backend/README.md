# Heliométrica — Backend

API REST do sistema de estimativa de eficiência de energia solar, construída com **Django 5.1** e **Django REST Framework**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Django 5.1 |
| API | Django REST Framework 3.15 |
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
|---|---|---|
| `GET` | `/api/health/` | Health check da API |
| `GET` | `/api/regions/` | Listar todas as regiões |
| `GET` | `/api/regions/{id}/` | Detalhe de uma região |
| `GET` | `/api/regions/?search=...` | Buscar regiões por nome ou estado |
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

A suite de testes cobre os 4 apps do backend:

| App | Classes de teste | Total de testes |
|---|---|---|
| `core` | `RegionModelTest`, `SolarModuleModelTest` | 11 |
| `estimates` | `WeatherSnapshotModelTest`, `EnergyEstimateModelTest` | 18 |
| `reporting` | `GenerationHistoryModelTest`, `ReportExportModelTest` | 15 |
| `regions` | `RegionAPITest` | 12 |
| `health` | `HealthCheckTest` | 1 |
| **Total** | 8 | **57** |

Cenários cobertos: criação de instâncias, valores padrão, `__str__`, constraints (`unique_together`), campos nullable, comportamento de FKs (`CASCADE`, `SET_NULL`), timestamps automáticos, CRUD via API REST, busca textual, e health check.

---

## Django Admin

Acesse `http://localhost:8000/admin/` após criar um superusuário. Todos os models estão registrados com filtros, busca e campos somente-leitura configurados.
