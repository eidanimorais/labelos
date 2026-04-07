# Migracao Inicial para Supabase

## Objetivo

Trocar o banco SQLite local por Postgres hospedado no Supabase sem parar o desenvolvimento.

## O que ja foi feito

- O backend agora aceita `DATABASE_URL`
- O schema principal esta centralizado em `apps/api/models.py`

## Riscos encontrados

- Existem varias migracoes e scripts ainda usando `sqlite3` diretamente
- Alguns scripts usam caminhos absolutos locais do seu computador
- A API ainda cria tabelas automaticamente na inicializacao, o que serve para agora, mas nao substitui uma estrategia de migracao versionada

## Ordem sugerida

1. Criar o projeto Supabase e obter a string Postgres
2. Validar que a API sobe com `DATABASE_URL` apontando para Postgres
3. Escolher um primeiro bloco de tabelas para migrar
4. Importar dados do SQLite para o Supabase por etapas
5. Revisar scripts que ainda assumem SQLite

## Primeiro bloco recomendado

- `profiles`
- `tracks`
- `splits`
- `works`
- `transactions`

Essas tabelas concentram o fluxo principal do produto e devem ser tratadas antes das rotinas auxiliares.

## Configuracao recomendada no ambiente hospedado

- `DATABASE_URL=<postgres do supabase>`
- `ALLOW_INSECURE_AUTH=false`
- `AUTO_CREATE_TABLES=false` quando a migracao estiver controlada fora do boot da API
