# Deploy da API na Railway

## Objetivo

Subir `apps/api` no plano mais barato possivel por enquanto, mantendo o frontend separado na Vercel.

## Estrategia recomendada

- Frontend: Vercel
- API Python: Railway
- Banco: Supabase Postgres

## Configuracao recomendada na Railway

- Source repo: este repositorio
- Root Directory: `/`
- Build Command: `pip install -r apps/api/requirements.txt`
- Start Command: `uvicorn apps.api.main:app --host 0.0.0.0 --port $PORT`
- Healthcheck Path: `/health`

## Variaveis de ambiente da API

- `DATABASE_URL`
- `SECRET_KEY`
- `JWT_ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=10080`
- `ALLOW_INSECURE_AUTH=false`
- `AUTO_CREATE_TABLES=true`
- `CORS_ALLOW_ORIGINS=<url-da-vercel>,http://localhost:5173`

## Connection string recomendada do Supabase

Para uma API persistente hospedada em ambiente com IPv4, prefira a string do pooler em session mode.

Exemplo de formato:

`postgres://postgres.<project-ref>:[SENHA]@aws-0-<region>.pooler.supabase.com:5432/postgres`

## Observacoes

- `AUTO_CREATE_TABLES=true` ajuda no bootstrap inicial, mas o ideal e desligar isso quando a estrategia de migracao estiver mais controlada.
- Se a aplicacao estiver no ar, mas sem responder corretamente, teste `GET /health`.
- O frontend na Vercel deve apontar `VITE_API_BASE_URL` para a URL publica gerada pela Railway.

