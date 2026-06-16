# Cenários de Teste Manual - Fallback da API de Clima

## Objetivo
Validar o fallback quando a API externa de clima falha, interagindo apenas com o **frontend** (navegador).

---

## Preparação

```bash
# Terminal 1: Backend
cd backend && source ../.venv/bin/activate && python manage.py runserver

# Terminal 2: Frontend
cd frontend && npm run dev
# Abre http://localhost:3000
```

---

## Cenário 1: API Falha + Cache Disponível → Fallback no Frontend

**Pré-condição:**
- Backend `.env`: `WEATHER_API_TIMEOUT_SECONDS=0.001` (força timeout)
- Existe `WeatherSnapshot` válido (últimos 7 dias, status ok/cached)

**Passos:**
1. Abrir `http://localhost:3000` no navegador
2. Abrir DevTools (F12) → aba **Network** → filtrar por `weather`
3. No mapa/lista, clicar em uma região
4. Observar painel lateral carregar dados de clima/estimativa

**Resultado esperado no Frontend:**
- Painel lateral carrega dados de clima/estimativa normalmente
- **DevTools Network:** request `/api/weather/?region_id=X` → **Status 200**
- Response JSON: `is_fallback: true`, `warning: "Dados em cache (API indisponível)."`
- **UI:** Toast/banner aparece: *"Dados em cache (API indisponível)."*
- Dados de clima/estimativa visíveis no painel lateral

---

## Cenário 2: API Falha + Sem Cache → Erro Amigável no Frontend

**Pré-condição:**
- Backend `.env`: `WEATHER_API_TIMEOUT_SECONDS=0.001`
- **NENHUM** `WeatherSnapshot` válido para a região (últimos 7 dias)

```bash
# Limpar cache
python backend/manage.py shell -c "
from apps.estimates.models import WeatherSnapshot
WeatherSnapshot.objects.all().delete()
"
```

**Passos:**
1. Recarregar página (`Ctrl+R`)
2. Selecionar região no mapa/lista

**Resultado esperado no Frontend:**
- **DevTools Network:** request `/api/weather/?region_id=X` → **Status 502**
- Response: `{"detail": "Falha ao consultar dados meteorológicos. Nenhum cache disponível."}`
- **UI:** Toast/banner de erro: *"Falha ao consultar dados meteorológicos. Nenhum cache disponível."*
- Painel lateral **não** mostra dados de clima (ou mostra estado vazio/erro)

