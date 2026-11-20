# AutoMate AI - Production Deployment Guide

This guide details the deployment of the AutoMate AI platform across development, containerized, and production cloud environments.

---

## 1. Environment Architecture

- **React Client**: Static Single Page Application (SPA) compiled via Vite, deployable to Nginx, Vercel, Netlify, or AWS S3/CloudFront.
- **FastAPI Backend**: Python ASGI application managed via Uvicorn/Gunicorn.
- **Database & Vectors**: Supabase PostgreSQL with `pgvector` extension and Supabase Storage.
- **Local AI Engine**: Local Ollama server exposing `/api/embeddings` and `/api/generate`.

---

## 2. Supabase Cloud Configuration

### Step 1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings -> Database**, note your database connection string.
3. Under **Project Settings -> API**, obtain:
   - Project URL (`https://<project-ref>.supabase.co`)
   - `anon` `public` key
   - `service_role` `secret` key

### Step 2: Run Database Migrations
In the Supabase **SQL Editor**, execute the migration scripts located in `backend/sql/`:
1. `01_schema.sql`: Enables `uuid-ossp` and `vector(384)`, creates relational tables and indexes.
2. `02_pgvector_search.sql`: Builds the HNSW index on `document_chunks(embedding vector_cosine_ops)` and establishes the `match_document_chunks` RPC function.
3. `03_seed_data.sql`: Populates baseline vehicles and technical trim configurations.

### Step 3: Storage Bucket
In **Storage**, create a new bucket named `brochures` for uploaded PDF manuals.

---

## 3. Ollama Production Setup

Install Ollama on your host machine or GPU instance (e.g. Ubuntu, Debian, Windows):

```bash
# Pull required models
ollama pull all-minilm
ollama pull qwen3:1.7b

# Verify models
ollama list
```

To run Ollama as a background systemd service on Linux:
```ini
# /etc/systemd/system/ollama.service
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="OLLAMA_HOST=127.0.0.1:11434"

[Install]
WantedBy=default.target
```

---

## 4. Backend Production Deployment

### Option A: Systemd + Gunicorn / Uvicorn (Linux)
Install dependencies and run with Gunicorn workers:
```bash
pip install -r backend/requirements.txt gunicorn

# Run server with 4 worker processes
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --chdir backend
```

### Option B: Docker Container
```dockerfile
FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY backend/sql ./sql
COPY sample_brochures ./sample_brochures

ENV PYTHONPATH="/app"
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 5. Frontend Production Deployment

### Build Static Assets
```bash
cd frontend
npm install
npm run build
```
This produces optimized production static assets in `frontend/dist/`.

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name automate.yourdomain.com;

    root /var/www/automate-ai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
    }
}
```

---

## 6. Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `APP_NAME` | Display name of the application | `AutoMate AI` |
| `PORT` | FastAPI listen port | `8000` |
| `CORS_ORIGINS` | Permitted browser origins | `http://localhost:5173,https://yourdomain.com` |
| `OLLAMA_BASE_URL` | Local Ollama HTTP endpoint | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Text generation LLM | `qwen3:1.7b` |
| `OLLAMA_EMBED_MODEL`| Embedding model | `all-minilm` |
| `EMBEDDING_DIMENSION`| Vector dimensions | `384` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend service-role key | `eyJh...` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Target FastAPI API route | `http://localhost:8000/api` |
| `VITE_APP_NAME` | Application UI title | `AutoMate AI` |
