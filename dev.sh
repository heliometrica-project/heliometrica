#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Iniciando backend (Django)..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
  echo "[ERRO] .venv não encontrado. Crie o ambiente virtual primeiro."
  exit 1
fi
source .venv/bin/activate
python manage.py runserver &
BACKEND_PID=$!

echo "==> Iniciando frontend (Vite)..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar ambos."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
