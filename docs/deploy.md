# Deploy — Heliométrica

Guia de implantação do sistema Heliométrica em servidor AWS EC2 com Nginx,
Gunicorn e build estático do frontend.

**URL pública:** <https://heliometrica.adrian.dep.ufersa.dev.br>

---

## Índice

1. [Infraestrutura](#1-infraestrutura)
2. [Dependências do sistema](#2-dependências-do-sistema)
3. [Repositório e variáveis de ambiente](#3-repositório-e-variáveis-de-ambiente)
4. [Backend (Django + Gunicorn)](#4-backend-django--gunicorn)
5. [Frontend (React + Vite)](#5-frontend-react--vite)
6. [Nginx](#6-nginx)
7. [Persistência e backup do banco](#7-persistência-e-backup-do-banco)
8. [Validação dos critérios de aceite](#8-validação-dos-critérios-de-aceite)
9. [Atualização do sistema em produção](#9-atualização-do-sistema-em-produção)

---

## 1. Infraestrutura

| Recurso | Valor |
|---------|-------|
| Provedor | AWS EC2 |
| AMI | Ubuntu 24.04 LTS |
| Tipo de instância | t2.micro (Free Tier) |
| Região | us-east-1 |
| Security Group | porta 80 (HTTP) e 443 (HTTPS) abertas para `0.0.0.0/0` |
| Armazenamento | EBS 8 GiB gp3 |
| Usuário padrão | `ubuntu` |

---

## 2. Dependências do sistema

```bash
sudo apt update && sudo apt upgrade -y

# Python e ferramentas
sudo apt install -y python3 python3-pip python3-venv

# Node.js 20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Servidor web e processo
sudo apt install -y nginx git curl
```

Verifique as versões instaladas:

```bash
python3 --version   # Python 3.12+
node --version      # v20+
npm --version       # 10+
nginx -v            # nginx/1.24+
```

---

## 3. Repositório e variáveis de ambiente

### 3.1 Clonar o repositório

```bash
cd /home/ubuntu
git clone https://github.com/<org>/heliometrica.git
cd heliometrica
```

### 3.2 Criar o `.env` de produção

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Conteúdo mínimo para produção:

```env
DEBUG=False
SECRET_KEY=<chave-secreta-longa-e-aleatoria>
DATABASE_URL=sqlite:////home/ubuntu/heliometrica/data/db.sqlite3
ALLOWED_HOSTS=heliometrica.adrian.dep.ufersa.dev.br,<ip-da-instancia>
CORS_ALLOWED_ORIGINS=https://heliometrica.adrian.dep.ufersa.dev.br
WEATHER_API_BASE_URL=https://api.open-meteo.com/v1/forecast
WEATHER_API_TIMEOUT_SECONDS=5
```

> **Atenção:** nunca commite o `.env` de produção. O arquivo está no `.gitignore`.

Gerar uma `SECRET_KEY` segura:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

## 4. Backend (Django + Gunicorn)

### 4.1 Ambiente virtual e dependências

```bash
cd /home/ubuntu/heliometrica
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install gunicorn
```

### 4.2 Migrações e seed inicial

```bash
# Criar diretório estável para o banco
mkdir -p /home/ubuntu/heliometrica/data

# Aplicar migrações
python backend/manage.py migrate

# Seed de regiões (municípios do Alto Oeste Potiguar/CE)
python backend/manage.py seed_regions

# Coletar arquivos estáticos do Django (admin, etc.)
python backend/manage.py collectstatic --no-input
```

### 4.3 Serviço systemd do Gunicorn

Crie o arquivo de serviço:

```bash
sudo nano /etc/systemd/system/heliometrica-api.service
```

Conteúdo:

```ini
[Unit]
Description=Heliometrica API (Gunicorn)
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/heliometrica/backend
EnvironmentFile=/home/ubuntu/heliometrica/backend/.env
ExecStart=/home/ubuntu/heliometrica/.venv/bin/gunicorn \
    --workers 2 \
    --bind unix:/run/heliometrica-api.sock \
    --access-logfile /var/log/heliometrica/gunicorn-access.log \
    --error-logfile /var/log/heliometrica/gunicorn-error.log \
    config.wsgi:application
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Ativar e iniciar:

```bash
sudo mkdir -p /var/log/heliometrica
sudo chown ubuntu:ubuntu /var/log/heliometrica

sudo systemctl daemon-reload
sudo systemctl enable heliometrica-api
sudo systemctl start heliometrica-api
sudo systemctl status heliometrica-api
```

---

## 5. Frontend (React + Vite)

### 5.1 Variável de ambiente

```bash
cd /home/ubuntu/heliometrica/frontend
cp .env.example .env
```

Editar `.env`:

```env
VITE_API_BASE_URL=https://heliometrica.adrian.dep.ufersa.dev.br/api
```

### 5.2 Build estático

```bash
npm install
npm run build
```

O build é gerado em `frontend/dist/`. O Nginx servirá esse diretório.

---

## 6. Nginx

### 6.1 Configuração

```bash
sudo nano /etc/nginx/sites-available/heliometrica
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name heliometrica.adrian.dep.ufersa.dev.br;

    # Frontend — arquivos estáticos do build Vite
    root /home/ubuntu/heliometrica/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend — proxy para o Gunicorn via socket Unix
    location /api/ {
        proxy_pass http://unix:/run/heliometrica-api.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Arquivos estáticos do Django (admin)
    location /static/ {
        alias /home/ubuntu/heliometrica/backend/staticfiles/;
    }
}
```

### 6.2 Ativar e testar

```bash
sudo ln -s /etc/nginx/sites-available/heliometrica \
           /etc/nginx/sites-enabled/heliometrica

# Remover config padrão se existir
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Persistência e backup do banco

O banco SQLite fica em `/home/ubuntu/heliometrica/data/db.sqlite3`, fora do
diretório de código, para não ser sobrescrito em atualizações.

### Backup manual

```bash
cp /home/ubuntu/heliometrica/data/db.sqlite3 \
   /home/ubuntu/heliometrica/data/db.sqlite3.bak-$(date +%Y%m%d)
```

### Backup automatizado com cron

```bash
crontab -e
```

Adicionar linha (backup diário às 3h):

```cron
0 3 * * * cp /home/ubuntu/heliometrica/data/db.sqlite3 \
  /home/ubuntu/heliometrica/data/db.sqlite3.bak-$(date +\%Y\%m\%d) 2>&1
```

Os backups ficam no mesmo diretório com sufixo de data. Remova os arquivos
antigos periodicamente:

```bash
# Manter apenas os últimos 7 backups
find /home/ubuntu/heliometrica/data -name "db.sqlite3.bak-*" \
     -mtime +7 -delete
```

---

## 8. Validação dos critérios de aceite

| Critério | Verificação |
|----------|-------------|
| URL pública acessa o sistema | `curl -I https://heliometrica.adrian.dep.ufersa.dev.br` → HTTP 200 |
| `/api/health` responde | `curl https://heliometrica.adrian.dep.ufersa.dev.br/api/health/` → `{"status":"ok","service":"heliometrica-api"}` |
| Dados persistem após restart | `sudo systemctl restart heliometrica-api` → dados do banco mantidos |
| Serviço sobe no boot | `sudo reboot` → `systemctl is-active heliometrica-api` → `active` |

Verificação rápida completa:

```bash
# Health check da API
curl https://heliometrica.adrian.dep.ufersa.dev.br/api/health/

# Status dos serviços
sudo systemctl status heliometrica-api
sudo systemctl status nginx

# Logs recentes
sudo journalctl -u heliometrica-api --since "5 minutes ago"
tail -20 /var/log/heliometrica/gunicorn-error.log
```

---

## 9. Atualização do sistema em produção

```bash
cd /home/ubuntu/heliometrica

# 1. Puxar alterações
git pull origin main

# 2. Atualizar dependências do backend (se houver mudança no requirements.txt)
source .venv/bin/activate
pip install -r backend/requirements.txt

# 3. Aplicar migrações
python backend/manage.py migrate

# 4. Coletar estáticos do Django
python backend/manage.py collectstatic --no-input

# 5. Rebuild do frontend (se houver mudança no frontend/)
cd frontend
npm install
npm run build
cd ..

# 6. Reiniciar o backend
sudo systemctl restart heliometrica-api

# 7. Reload do Nginx (sem downtime)
sudo systemctl reload nginx
```
