# Heliométrica

Sistema de apoio à medição e análise de eficiência de energia solar.

## Como rodar

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

## Convenções de commit

Este projeto adota [Conventional Commits](https://www.conventionalcommits.org/).
