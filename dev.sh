#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "==> Encerrando serviços..."
  kill "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "==> Preparando ambiente..."

# ------------------------------------------------------------------
# Backend
# ------------------------------------------------------------------

cd "$ROOT_DIR/backend"

if [ ! -d ".venv" ]; then
  echo "==> Criando ambiente virtual..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "==> Instalando dependências do backend..."
pip install -r requirements.txt

# Executa migrations automaticamente
echo "==> Aplicando migrations..."
python manage.py migrate

echo "==> Iniciando backend..."
python manage.py runserver &
BACKEND_PID=$!

# ------------------------------------------------------------------
# Frontend
# ------------------------------------------------------------------

cd "$ROOT_DIR/frontend"

if [ ! -d "node_modules" ]; then
  echo "==> Instalando dependências do frontend..."
  npm install
fi

echo "==> Iniciando frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Backend : http://localhost:8000"
echo "Frontend: consulte a URL exibida pelo Vite"
echo "========================================"
echo ""
echo "Pressione Ctrl+C para encerrar."
echo ""

wait
