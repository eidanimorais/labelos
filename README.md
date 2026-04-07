# label-os

Base inicial do projeto `label-os`, agora reposicionada para um caminho mais simples com frontend em Vite/React e backend principal no Supabase.

## Estrutura

- `apps/web`: interface web
- `apps/api`: backend legado em Python, mantido apenas como referencia temporaria de regras de negocio
- `scripts`: utilitarios locais e migracoes operacionais
- `sample-data`: amostras seguras para desenvolvimento
- `supabase`: esquema e migracoes do novo backend principal

## Primeira fase de hospedagem

Esta fase prepara o projeto para:

- versionamento limpo no GitHub
- deploy do frontend na Vercel
- centralizacao do backend no Supabase
- reducao gradual da dependencia da API Python

## Proximos passos

- configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na Vercel
- criar o esquema inicial no Supabase
- migrar autenticacao, perfis, tracks e splits em etapas
- manter a API Python apenas como apoio temporario ate o frontend nao depender mais dela

Consulte `docs/migration-plan.md` para o plano inicial.

## Deploy e banco

- Guia inicial de deploy: `docs/deploy-vercel.md`
- Guia inicial de migracao de banco: `docs/supabase-migration.md`
- Arquitetura alvo simplificada: `docs/supabase-first-architecture.md`
- Limites entre nucleo e apps satelites: `docs/app-boundaries.md`
