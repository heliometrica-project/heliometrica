# Documentação da API Heliométrica

## Visão Geral

A API Heliométrica fornece endpoints para gerenciamento de estimativas de geração de energia solar fotovoltaica. Permite cadastrar módulos solares, consultar dados climáticos, calcular estimativas de geração e gerar relatórios.

**Base URL**: `http://localhost:8000/api` (desenvolvimento)  
**Protocolo**: HTTPS em produção  
**Formato**: JSON  
**Autenticação**: JWT (Bearer Token)

---

## Autenticação

A API utiliza **JWT (JSON Web Tokens)** para autenticação stateless. O fluxo padrão:

1. **Registro** (`POST /api/auth/register/`) → recebe `access` e `refresh` tokens
2. **Login** (`POST /api/auth/login/`) → recebe `access` e `refresh` tokens
3. **Uso**: Incluir header `Authorization: Bearer <access_token>` nas requisições protegidas
4. **Renovação** (`POST /api/auth/refresh/`) → usa `refresh` token para obter novo `access` token

### Tokens

| Token | Validade | Uso |
|-------|----------|-----|
| Access | 5 min (configurável) | Autorização nas requisições |
| Refresh | 24h (configurável) | Renovação do access token |

### Headers Obrigatórios

```http
Content-Type: application/json
Authorization: Bearer <access_token>  # Apenas endpoints protegidos
```

---

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Dados inválidos ou parâmetros faltando |
| 401 | Unauthorized - Token inválido, expirado ou ausente |
| 403 | Forbidden - Acesso negado (permissões insuficientes) |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro interno do servidor |
| 502 | Bad Gateway - Falha ao consultar serviço externo (ex: API climática) |

---

## Formato de Resposta de Erro

Todas as respostas de erro seguem o padrão:

```json
{
  "detail": "Mensagem descritiva do erro"
}
```

Para erros de validação (400), pode conter detalhes por campo:

```json
{
  "campo": ["Mensagem de erro do campo"],
  "outro_campo": ["Outro erro"]
}
```

---

## Endpoints

### 1. Health Check
### 2. Autenticação
### 3. Regiões
### 4. Módulos Solares
### 5. Estimativas
### 6. Histórico e Relatórios

---

## Referência Rápida de Endpoints

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/health/` | Verifica saúde da API | Não |
| POST | `/api/auth/register/` | Registra novo usuário | Não |
| POST | `/api/auth/login/` | Login (obtém tokens) | Não |
| POST | `/api/auth/refresh/` | Renova access token | Não |
| GET | `/api/auth/me/` | Dados do usuário logado | Sim |
| GET | `/api/regions/` | Lista regiões (com busca) | Não |
| GET | `/api/regions/{id}/` | Detalhes de uma região | Não |
| GET | `/api/modules/` | Lista módulos do usuário | Sim |
| POST | `/api/modules/` | Cria módulo solar | Sim |
| GET | `/api/modules/{id}/` | Detalhes de um módulo | Sim |
| PUT | `/api/modules/{id}/` | Atualiza módulo (completo) | Sim |
| PATCH | `/api/modules/{id}/` | Atualiza módulo (parcial) | Sim |
| DELETE | `/api/modules/{id}/` | Remove módulo | Sim |
| GET | `/api/weather/?region_id={id}` | Dados climáticos de uma região | Não |
| POST | `/api/estimates/` | Cria estimativa de energia | Sim |
| POST | `/api/estimates/compare/` | Compara regiões | Não |
| GET | `/api/history/` | Lista histórico do usuário | Sim |
| POST | `/api/history/` | Salva estimativa no histórico | Sim |
| GET | `/api/history/{id}/` | Detalhes de um histórico | Sim |
| PUT | `/api/history/{id}/` | Atualiza histórico (completo) | Sim |
| PATCH | `/api/history/{id}/` | Atualiza histórico (parcial) | Sim |
| DELETE | `/api/history/{id}/` | Remove histórico | Sim |
| GET | `/api/history/{id}/export/` | Exporta relatório CSV | Sim |

## 1. Health Check

### `GET /api/health/`

Verifica se a API está operacional.

**Autenticação**: Não requerida

**Resposta 200**:
```json
{
  "status": "ok",
  "service": "heliometrica-api"
}
``
cURL:
curl -X GET http://localhost:8000/api/health/

## 2. Autenticação

### `POST /api/auth/register/`

Registra um novo usuário e retorna tokens JWT.

**Autenticação**: Não requerida

**Request Body**:
```json
{
  "username": "string (obrigatório, único)",
  "email": "string (obrigatório, único, formato email)",
  "password": "string (obrigatório, min 8 chars, validação Django)",
  "password_confirm": "string (obrigatório, deve ser igual a password)",
  "first_name": "string (opcional)",
  "last_name": "string (opcional)"
}
```

**Resposta 201**:
```json
{
  "id": 1,
  "username": "usuario",
  "email": "usuario@exemplo.com",
  "first_name": "Nome",
  "last_name": "Sobrenome",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros**:
- 400: `{"username": ["já existe."], "email": ["já existe."], "password_confirm": ["As senhas informadas não conferem."], "password": ["A senha é muito curta.", "A senha é muito comum."]}`

**cURL**:
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao",
    "email": "joao@email.com",
    "password": "senha123456",
    "password_confirm": "senha123456",
    "first_name": "João",
    "last_name": "Silva"
  }'
```

---

### `POST /api/auth/login/`

Autentica usuário e retorna tokens JWT.

**Autenticação**: Não requerida

**Request Body**:
```json
{
  "username": "string (obrigatório)",
  "password": "string (obrigatório)"
}
```

**Resposta 200**:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros**:
- 401: `{"detail": "Credenciais inválidas."}`

**cURL**:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "joao", "password": "senha123456"}'
```

---

### `POST /api/auth/refresh/`

Renova o access token usando o refresh token.

**Autenticação**: Não requerida

**Request Body**:
```json
{
  "refresh": "string (obrigatório, refresh token válido)"
}
```

**Resposta 200**:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros**:
- 401: `{"detail": "Token inválido ou expirado.", "code": "token_not_valid"}`

**cURL**:
```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

---

### `GET /api/auth/me/`

Retorna dados do usuário autenticado.

**Autenticação**: **Obrigatória** (Bearer Token)

**Headers**:
```http
Authorization: Bearer <access_token>
```

**Resposta 200**:
```json
{
  "id": 1,
  "username": "joao",
  "email": "joao@email.com",
  "first_name": "João",
  "last_name": "Silva"
}
```

**Erros**:
- 401: `{"detail": "Credenciais de autenticação não fornecidas."}`

**cURL**:
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 3. Regiões

### `GET /api/regions/`

Lista todas as regiões cadastradas com suporte a busca e paginação.

**Autenticação**: Não requerida

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `search` | string | Busca por nome ou estado (ex: `?search=Fortaleza` ou `?search=CE`) |
| `page` | integer | Número da página (padrão: 1) |
| `page_size` | integer | Itens por página (padrão: 20, máx: 100) |

**Resposta 200** (paginada):
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/regions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Natal",
      "state": "RN",
      "latitude": "-5.7945",
      "longitude": "-35.2110"
    },
    {
      "id": 2,
      "name": "Fortaleza",
      "state": "CE",
      "latitude": "-3.7319",
      "longitude": "-38.5267"
    }
  ]
}
```

**cURL**:
```bash
# Listar todas
curl -X GET http://localhost:8000/api/regions/

# Buscar por nome/estado
curl -X GET "http://localhost:8000/api/regions/?search=Natal"

# Com paginação
curl -X GET "http://localhost:8000/api/regions/?page=2&page_size=10"
```

---

### `GET /api/regions/{id}/`

Retorna detalhes de uma região específica.

**Autenticação**: Não requerida

**Path Parameter**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | integer | ID da região |

**Resposta 200**:
```json
{
  "id": 1,
  "name": "Natal",
  "state": "RN",
  "latitude": "-5.7945",
  "longitude": "-35.2110"
}
```

**Erros**:
- 404: `{"detail": "Não encontrado."}`

**cURL**:
```bash
curl -X GET http://localhost:8000/api/regions/1/
```

## 4. Módulos Solares

Todos os endpoints requerem autenticação (Bearer Token). O usuário só acessa seus próprios módulos.

### `GET /api/modules/`

Lista todos os módulos solares do usuário autenticado.

**Autenticação**: **Obrigatória** (Bearer Token)

**Resposta 200**:
```json
[
  {
    "id": 1,
    "model": "RS-540M10",
    "manufacturer": "Canadian Solar",
    "power_wp": "540.00",
    "efficiency": "21.30",
    "area_m2": "2.53",
    "quantity": 10,
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

**cURL**:
```bash
curl -X GET http://localhost:8000/api/modules/ \
  -H "Authorization: Bearer <access_token>"
```

---

### `POST /api/modules/`

Cria um novo módulo solar para o usuário autenticado.

**Autenticação**: **Obrigatória** (Bearer Token)

**Request Body**:
```json
{
  "model": "string (obrigatório, ex: RS-540M10)",
  "manufacturer": "string (obrigatório, ex: Canadian Solar)",
  "power_wp": "number (obrigatório, > 0, ex: 540)",
  "efficiency": "number (obrigatório, 0-100, ex: 21.3)",
  "area_m2": "number (obrigatório, > 0, ex: 2.53)",
  "quantity": "integer (opcional, > 0, padrão: 1)"
}
```

**Resposta 201**:
```json
{
  "id": 1,
  "model": "RS-540M10",
  "manufacturer": "Canadian Solar",
  "power_wp": "540.00",
  "efficiency": "21.30",
  "area_m2": "2.530",
  "quantity": 10,
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Erros**:
- 400: Validação - `{"power_wp": ["A potência deve ser maior que zero."], "efficiency": ["A eficiência deve estar entre 0 e 100%."], "area_m2": ["A área deve ser maior que zero."], "quantity": ["A quantidade deve ser maior que zero."]}`
- 401: Token inválido/ausente

**cURL**:
```bash
curl -X POST http://localhost:8000/api/modules/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "model": "RS-540M10",
    "manufacturer": "Canadian Solar",
    "power_wp": 540,
    "efficiency": 21.3,
    "area_m2": 2.53,
    "quantity": 10
  }'
```

---

### `GET /api/modules/{id}/`

Retorna detalhes de um módulo solar específico do usuário.

**Autenticação**: **Obrigatória** (Bearer Token)

**Path Parameter**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | integer | ID do módulo |

**Resposta 200**:
```json
{
  "id": 1,
  "model": "RS-540M10",
  "manufacturer": "Canadian Solar",
  "power_wp": "540.00",
  "efficiency": "21.30",
  "area_m2": "2.530",
  "quantity": 10,
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Erros**:
- 404: `{"detail": "Não encontrado."}` (módulo não existe ou não pertence ao usuário)
- 401: Token inválido/ausente

**cURL**:
```bash
curl -X GET http://localhost:8000/api/modules/1/ \
  -H "Authorization: Bearer <access_token>"
```

---

### `PUT /api/modules/{id}/`

Atualiza completamente um módulo solar (todos os campos obrigatórios).

**Autenticação**: **Obrigatória** (Bearer Token)

**Path Parameter**: `id` (integer)

**Request Body** (todos campos obrigatórios):
```json
{
  "model": "string",
  "manufacturer": "string",
  "power_wp": "number (> 0)",
  "efficiency": "number (0-100)",
  "area_m2": "number (> 0)",
  "quantity": "integer (> 0)"
}
```

**Resposta 200**: Mesmo formato do GET (dados atualizados)

**Erros**: 400 (validação), 404 (não encontrado), 401 (auth)

**cURL**:
```bash
curl -X PUT http://localhost:8000/api/modules/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "model": "RS-540M10M10",
    "manufacturer": "Canadian Solar",
    "power_wp": 540,
    "efficiency": 21.3,
    "area_m2": 2.53,
    "quantity": 12
  }'
```

---

### `PATCH /api/modules/{id}/`

Atualiza parcialmente um módulo solar (apenas campos enviados).

**Autenticação**: **Obrigatória** (Bearer Token)

**Path Parameter**: `id` (integer)

**Request Body** (qualquer combinação de campos):
```json
{
  "quantity": 15
}
```

**Resposta 200**: Mesmo formato do GET (dados atualizados)

**Erros**: 400 (validação), 404 (não encontrado), 401 (auth)

**cURL**:
```bash
curl -X PATCH http://localhost:8000/api/modules/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"quantity": 15}'
```

---

### `DELETE /api/modules/{id}/`

Remove um módulo solar do usuário.

**Autenticação**: **Obrigatória** (Bearer Token)

**Path Parameter**: `id` (integer)

**Resposta 204**: Sem conteúdo (sucesso)

**Erros**:
- 404: `{"detail": "Não encontrado."}`
- 401: Token inválido/ausente

**cURL**:
```bash
curl -X DELETE http://localhost:8000/api/modules/1/ \
  -H "Authorization: Bearer <access_token>"
```

## 5. Estimativas

### `GET /api/weather/`

Consulta dados climáticos (irradiação, temperatura, cobertura de nuvens) para uma região.

**Autenticação**: Não requerida

**Query Parameters**:
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `region_id` | integer | Sim | ID da região |

**Resposta 200**:
```json
{
  "id": 1,
  "region": 1,
  "region_name": "Natal",
  "region_state": "RN",
  "date": "2025-01-15",
  "irradiation": "5.420",
  "temperature": "28.50",
  "cloud_cover": "35.20",
  "source": "open-meteo",
  "status": "ok",
  "created_at": "2025-01-15T06:00:00Z",
  "is_fallback": false,
  "fallback_message": null
}
```

**Resposta 200 (com fallback - cache)**:
```json
{
  "id": 1,
  "region": 1,
  "region_name": "Natal",
  "region_state": "RN",
  "date": "2025-01-14",
  "irradiation": "5.200",
  "temperature": "27.80",
  "cloud_cover": "40.00",
  "source": "open-meteo",
  "status": "cached",
  "created_at": "2025-01-14T06:00:00Z",
  "is_fallback": true,
  "fallback_message": "Dados em cache de 14/01/2025 (API indisponível).",
  "warning": "Dados em cache (API indisponível)."
}
```

**Erros**:
- 400: `{"detail": "Informe o parametro region_id."}`
- 404: `{"detail": "Região não encontrada."}`
- 502: `{"detail": "Falha ao consultar dados meteorológicos. Nenhum cache disponível."}`

**cURL**:
```bash
curl -X GET "http://localhost:8000/api/weather/?region_id=1"
```

---

### `POST /api/estimates/`

Cria uma estimativa de geração de energia para um módulo solar em uma região.

**Autenticação**: **Obrigatória** (Bearer Token)

**Request Body**:
```json
{
  "region_id": 1,
  "module_id": 1
}
```

**Resposta 201**:
```json
{
  "id": 1,
  "daily_kwh": "28.450",
  "monthly_kwh": "853.500",
  "annual_kwh": "10387.250",
  "efficiency_index": "0.8234"
}
```

**Erros**:
- 400: `{"region_id": ["Campo obrigatório."], "module_id": ["Campo obrigatório."]}`
- 401: Token inválido/ausente
- 404: `{"detail": "Região não encontrada."}` ou `{"detail": "Módulo não encontrado."}` (módulo não existe ou não pertence ao usuário)
- 502: `{"detail": "Falha ao consultar dados meteorológicos. Nenhum cache disponível."}` ou `{"detail": "Dados climáticos indisponíveis para a região."}`

**cURL**:
```bash
curl -X POST http://localhost:8000/api/estimates/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"region_id": 1, "module_id": 1}'
```

---

### `POST /api/estimates/compare/`

Compara estimativas médias de energia entre múltiplas regiões (usa módulo padrão de referência).

**Autenticação**: Não requerida

**Request Body**:
```json
{
  "region_ids": [1, 2, 3]
}
```

**Validações**:
- Mínimo 2 regiões
- IDs devem ser únicos
- Todas as regiões devem existir

**Resposta 200**:
```json
{
  "metric": "average_energy_estimates",
  "region_ids": [1, 2, 3],
  "1": {
    "region_name": "Natal",
    "region_state": "RN",
    "daily_kwh": "28.450",
    "monthly_kwh": "853.500",
    "annual_kwh": "10387.250"
  },
  "2": {
    "region_name": "Fortaleza",
    "region_state": "CE",
    "daily_kwh": "26.800",
    "monthly_kwh": "804.000",
    "annual_kwh": "9786.000"
  },
  "3": {
    "region_name": "Recife",
    "region_state": "PE",
    "daily_kwh": "25.200",
    "monthly_kwh": "756.000",
    "annual_kwh": "9204.000"
  }
}
```

**Erros**:
- 400: `{"detail": "Informe pelo menos 2 regiões distintas para comparar."}` ou `{"detail": "Uma ou mais regiões informadas não existem.", "invalid_region_ids": [999]}`
- 502: Se falha ao buscar dados climáticos para qualquer região

**cURL**:
```bash
curl -X POST http://localhost:8000/api/estimates/compare/ \
  -H "Content-Type: application/json" \
  -d '{"region_ids": [1, 2, 3]}'
```

## 6. Histórico e Relatórios

Todos os endpoints requerem autenticação (Bearer Token). O usuário só acessa seu próprio histórico.

### `GET /api/history/`

Lista todo o histórico de estimativas salvas do usuário autenticado.

**Autenticação**: **Obrigatória** (Bearer Token)

**Resposta 200**:
```json
[
  {
    "id": 1,
    "title": "Minha Casa - Natal",
    "estimate": 1,
    "notes": "Estimativa para telhado residencial",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "region_name": "Natal",
    "region_state": "RN",
    "daily_kwh": "28.450",
    "monthly_kwh": "853.500",
    "yearly_kwh": "10387.250",
    "efficiency_index": "0.8234",
    "module_model": "RS-540M10",
    "module_manufacturer": "Canadian Solar",
    "module_power_wp": "540.00"
  }
]
```

**cURL**:
```bash
curl -X GET http://localhost:8000/api/history/ \
  -H "Authorization: Bearer <access_token>"
```

---

### `POST /api/history/`

Salva uma estimativa no histórico do usuário com título e notas opcionais.

**Autenticação**: **Obrigatória** (Bearer Token)

**Request Body**:
```json
{
  "title": "string (obrigatório, max 300 chars)",
  "estimate": 1,
  "notes": "string (opcional)"
}
```

**Validação**: O `estimate` deve pertencer ao usuário autenticado.

**Resposta 201**:
```json
{
  "id": 1,
  "title": "Minha Casa - Natal",
  "estimate": 1,
  "notes": "Estimativa para telhado residencial",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "region_name": "Natal",
  "region_state": "RN",
  "daily_kwh": "28.450",
  "monthly_kwh": "853.500",
  "yearly_kwh": "10387.250",
  "efficiency_index": "0.8234",
  "module_model": "RS-540M10",
  "module_manufacturer": "Canadian Solar",
  "module_power_wp": "540.00"
}
```

**Erros**:
- 400: `{"title": ["Campo obrigatório."], "estimate": ["Campo obrigatório."], "estimate": ["A estimativa informada não pertence ao usuário atual."]}`
- 401: Token inválido/ausente

**cURL**:
```bash
curl -X POST http://localhost:8000/api/history/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "title": "Minha Casa - Natal",
    "estimate": 1,
    "notes": "Estimativa para telhado residencial"
  }'
```

---

### `GET /api/history/{id}/`

Retorna detalhes de um item do histórico específico do usuário.

**Autenticação**: **Obrigatória** (Bearer Token)

**Path Parameter**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | integer | ID do histórico |

**Resposta 200**: Mesmo formato do item na listagem (ver GET /api/history/)

**Erros**:
- 404: `{"detail": "Não encontrado."}` (histórico não existe ou não pertence ao usuário)
- 401: Token inválido/ausente

**cURL**:
```bash
curl -X GET http://localhost:8000/api/history/1/ \
  -H "Authorization: Bearer <access_token>"
```

---

### `PUT /api/history/{id}/`

Atualiza completamente um item do histórico (todos campos obrigatórios exceto notes).

**Autenticação**: **Obrigatória** (Bearer Token)

**Path Parameter**: `id` (integer)

**Request Body**:
```json
{
  "title": "string (obrigatório)",
  "estimate": 1,
  "notes": "string (opcional)"
}
```

**Validação**: O `estimate` deve pertencer ao usuário autenticado.

**Resposta 200**: Mesmo formato do GET (dados atualizados)

**Erros**: 400 (validação), 404 (não encontrado), 401 (auth)

**cURL**:
```bash
curl -X PUT http://localhost:8000/api/history/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "title": "Minha Casa - Natal (Atualizado)",
    "estimate": 1,
    "notes": "Notas atualizadas"
  }'
```

---

### `PATCH /api/history/{id}/`

Atualiza parcialmente um item do histórico (apenas campos enviados).

**Autenticação**: **Obrigatória** (Bearer Token)

**Path Parameter**: `id` (integer)

**Request Body** (qualquer combinação):
```json
{
  "title": "Novo Título",
  "notes": "Novas notas"
}
```

**Resposta 200**: Mesmo formato do GET (dados atualizados)

**Erros**: 400 (validação), 404 (não encontrado), 401 (auth)

**cURL**:
```bash
curl -X PATCH http://localhost:8000/api/history/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"notes": "Notas atualizadas"}'
```

---

### `DELETE /api/history/{id}/`

Remove um item do histórico do usuário.

**Autenticação**: **Obrigatória** (Bearer Token)

**Path Parameter**: `id` (integer)

**Resposta 204**: Sem conteúdo (sucesso)

**Erros**:
- 404: `{"detail": "Não encontrado."}`
- 401: Token inválido/ausente

**cURL**:
```bash
curl -X DELETE http://localhost:8000/api/history/1/ \
  -H "Authorization: Bearer <access_token>"
```

---

### `GET /api/history/{id}/export/`

Exporta relatório em CSV de uma estimativa salva no histórico.

**Autenticação**: **Obrigatória** (Bearer Token)

**Path Parameter**: `id` (integer)

**Resposta 200**: Arquivo CSV (Content-Type: text/csv; Content-Disposition: attachment)

**Cabeçalhos CSV**:
```csv
Campo,Valor
Título,Minha Casa - Natal
Região,Natal - RN
Módulo,Canadian Solar RS-540M10 (540.00 Wp)
Data da Estimativa,15/01/2025
Energia Diária (kWh),28.450
Energia Mensal (kWh),853.500
Energia Anual (kWh),10387.250
Índice de Eficiência (PR),0.8234
Observações,Estimativa para telhado residencial
```

**Erros**:
- 404: `{"detail": "Não encontrado."}`
- 401: Token inválido/ausente

**cURL**:
```bash
# Salvar arquivo
curl -X GET http://localhost:8000/api/history/1/export/ \
  -H "Authorization: Bearer <access_token>" \
  -o relatorio.csv
```

## 7. Apêndices

### 7.1 Códigos de Erro por Endpoint

| Endpoint | 400 | 401 | 404 | 502 |
|----------|-----|-----|-----|-----|
| `POST /api/auth/register/` | Validação (username, email, password, password_confirm) | - | - | - |
| `POST /api/auth/login/` | - | Credenciais inválidas | - | - |
| `POST /api/auth/refresh/` | - | Token inválido/expirado | - | - |
| `GET /api/auth/me/` | - | Token ausente/inválido | - | - |
| `GET /api/regions/` | - | - | - | - |
| `GET /api/regions/{id}/` | - | - | Não encontrado | - |
| `GET /api/modules/` | - | Token inválido/ausente | - | - |
| `POST /api/modules/` | Validação (power_wp, efficiency, area_m2, quantity) | Token inválido/ausente | - | - |
| `GET/PUT/PATCH/DELETE /api/modules/{id}/` | Validação | Token inválido/ausente | Não encontrado (ou não pertence ao user) | - |
| `GET /api/weather/` | region_id obrigatório | - | Região não encontrada | Falha API climática / sem cache |
| `POST /api/estimates/` | region_id, module_id obrigatórios | Token inválido/ausente | Região ou módulo não encontrado | Falha API climática / dados indisponíveis |
| `POST /api/estimates/compare/` | Mín 2 regiões, IDs únicos, regiões existem | - | - | Falha API climática |
| `GET/POST /api/history/` | title, estimate obrigatórios; estimate pertence ao user | Token inválido/ausente | - | - |
| `GET/PUT/PATCH/DELETE /api/history/{id}/` | Validação (estimate pertence ao user) | Token inválido/ausente | Não encontrado (ou não pertence ao user) | - |
| `GET /api/history/{id}/export/` | - | Token inválido/ausente | Não encontrado (ou não pertence ao user) | - |

---

### 7.2 Mapeamento Requisitos → Endpoints

| Requisito / Funcionalidade | Endpoints Envolvidos |
|---------------------------|---------------------|
| **Cadastro de usuário** | `POST /api/auth/register/` |
| **Login / Autenticação** | `POST /api/auth/login/`, `POST /api/auth/refresh/`, `GET /api/auth/me/` |
| **Listar/buscar regiões** | `GET /api/regions/`, `GET /api/regions/{id}/` |
| **Cadastrar módulo solar** | `POST /api/modules/` |
| **Listar/meus módulos** | `GET /api/modules/`, `GET /api/modules/{id}/` |
| **Editar/remover módulo** | `PUT/PATCH/DELETE /api/modules/{id}/` |
| **Consultar dados climáticos** | `GET /api/weather/?region_id={id}` |
| **Calcular estimativa de energia** | `POST /api/estimates/` |
| **Comparar regiões** | `POST /api/estimates/compare/` |
| **Salvar estimativa no histórico** | `POST /api/history/` |
| **Listar/ver histórico** | `GET /api/history/`, `GET /api/history/{id}/` |
| **Editar/remover histórico** | `PUT/PATCH/DELETE /api/history/{id}/` |
| **Exportar relatório CSV** | `GET /api/history/{id}/export/` |
| **Health check / monitoramento** | `GET /api/health/` |

---

### 7.3 Collection Postman (JSON)

Importe este JSON no Postman: **File → Import → Raw Text → Cole o conteúdo abaixo**

```json
{
  "info": {
    "name": "Heliométrica API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "base_url", "value": "http://localhost:8000/api" },
    { "key": "access_token", "value": "" },
    { "key": "refresh_token", "value": "" }
  ],
  "item": [
    {
      "name": "Health Check",
      "item": [
        {
          "name": "GET Health",
          "request": { "method": "GET", "url": "{{base_url}}/health/" }
        }
      ]
    },
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/register/",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"username\": \"joao\",\n  \"email\": \"joao@email.com\",\n  \"password\": \"senha123456\",\n  \"password_confirm\": \"senha123456\",\n  \"first_name\": \"João\",\n  \"last_name\": \"Silva\"\n}" }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/login/",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"username\": \"joao\",\n  \"password\": \"senha123456\"\n}" }
          }
        },
        {
          "name": "Refresh Token",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/refresh/",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"refresh\": \"{{refresh_token}}\"\n}" }
          }
        },
        {
          "name": "Me",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/auth/me/",
            "header": [{ "key": "Authorization", "value": "Bearer {{access_token}}" }]
          }
        }
      ]
    },
    {
      "name": "Regiões",
      "item": [
        {
          "name": "Listar (com busca)",
          "request": { "method": "GET", "url": "{{base_url}}/regions/?search=Natal" }
        },
        {
          "name": "Detalhe",
          "request": { "method": "GET", "url": "{{base_url}}/regions/1/" }
        }
      ]
    },
    {
      "name": "Módulos Solares",
      "item": [
        {
          "name": "Listar",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/modules/",
            "header": [{ "key": "Authorization", "value": "Bearer {{access_token}}" }]
          }
        },
        {
          "name": "Criar",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/modules/",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{access_token}}" }
            ],
            "body": { "mode": "raw", "raw": "{\n  \"model\": \"RS-540M10\",\n  \"manufacturer\": \"Canadian Solar\",\n  \"power_wp\": 540,\n  \"efficiency\": 21.3,\n  \"area_m2\": 2.53,\n  \"quantity\": 10\n}" }
          }
        },
        {
          "name": "Detalhe",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/modules/1/",
            "header": [{ "key": "Authorization", "value": "Bearer {{access_token}}" }]
          }
        },
        {
          "name": "Atualizar (PUT)",
          "request": {
            "method": "PUT",
            "url": "{{base_url}}/modules/1/",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{access_token}}" }
            ],
            "body": { "mode": "raw", "raw": "{\n  \"model\": \"RS-540M10\",\n  \"manufacturer\": \"Canadian Solar\",\n  \"power_wp\": 540,\n  \"efficiency\": 21.3,\n  \"area_m2\": 2.53,\n  \"quantity\": 12\n}" }
          }
        },
        {
          "name": "Atualizar Parcial (PATCH)",
          "request": {
            "method": "PATCH",
            "url": "{{base_url}}/modules/1/",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{access_token}}" }
            ],
            "body": { "mode": "raw", "raw": "{\n  \"quantity\": 15\n}" }
          }
        },
        {
          "name": "Deletar",
          "request": {
            "method": "DELETE",
            "url": "{{base_url}}/modules/1/",
            "header": [{ "key": "Authorization", "value": "Bearer {{access_token}}" }]
          }
        }
      ]
    },
    {
      "name": "Estimativas",
      "item": [
        {
          "name": "Weather (dados climáticos)",
          "request": { "method": "GET", "url": "{{base_url}}/weather/?region_id=1" }
        },
        {
          "name": "Criar Estimativa",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/estimates/",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{access_token}}" }
            ],
            "body": { "mode": "raw", "raw": "{\n  \"region_id\": 1,\n  \"module_id\": 1\n}" }
          }
        },
        {
          "name": "Comparar Regiões",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/estimates/compare/",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"region_ids\": [1, 2, 3]\n}" }
          }
        }
      ]
    },
    {
      "name": "Histórico e Relatórios",
      "item": [
        {
          "name": "Listar Histórico",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/history/",
            "header": [{ "key": "Authorization", "value": "Bearer {{access_token}}" }]
          }
        },
        {
          "name": "Salvar no Histórico",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/history/",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{access_token}}" }
            ],
            "body": { "mode": "raw", "raw": "{\n  \"title\": \"Minha Casa - Natal\",\n  \"estimate\": 1,\n  \"notes\": \"Estimativa para telhado residencial\"\n}" }
          }
        },
        {
          "name": "Detalhe Histórico",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/history/1/",
            "header": [{ "key": "Authorization", "value": "Bearer {{access_token}}" }]
          }
        },
        {
          "name": "Exportar CSV",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/history/1/export/",
            "header": [{ "key": "Authorization", "value": "Bearer {{access_token}}" }]
          }
        }
      ]
    }
  ]
}
```
  