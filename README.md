# label-os

Base inicial do projeto `label-os`, com frontend em Vite/React e backend em FastAPI.

## Estrutura

- `apps/web`: interface web
- `apps/api`: API e regras de negocio
- `scripts`: utilitarios locais e migracoes operacionais
- `sample-data`: amostras seguras para desenvolvimento

## Primeira fase de hospedagem

Esta primeira fase prepara o projeto para:

- versionamento limpo no GitHub
- deploy incremental na Vercel para o frontend
- desacoplamento do banco local para migracao gradual ao Supabase

## Proximos passos

- publicar este codigo no GitHub sem bancos locais, logs e credenciais
- configurar variaveis de ambiente para frontend e backend
- subir o frontend na Vercel com preview deploys
- tornar a API configuravel por `DATABASE_URL`
- migrar tabelas do SQLite para Postgres/Supabase em etapas

Consulte `docs/migration-plan.md` para o plano inicial.

## Deploy e banco

- Guia inicial de deploy: `docs/deploy-vercel.md`
- Guia inicial de migracao de banco: `docs/supabase-migration.md`
