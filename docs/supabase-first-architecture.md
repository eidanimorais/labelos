# Arquitetura alvo simplificada

## Objetivo

Levar o `label-os` para uma arquitetura mais simples, com menos infraestrutura para manter:

- `GitHub` para versionamento
- `Vercel` para hospedar o frontend
- `Supabase` como backend principal

Neste desenho, a pasta `apps/api` deixa de ser o centro da aplicacao e passa a servir apenas como referencia temporaria de regras de negocio que ainda nao migramos.

## Arquitetura recomendada agora

- `apps/web`: frontend em Vite/React
- `supabase`: esquema, migracoes e recursos centrais do backend
- `apps/api`: legado temporario

## O que vai para o Supabase

- autenticacao de usuarios
- banco Postgres principal
- storage para arquivos quando necessario
- regras leves via views, policies e, se precisar, edge functions

## O que sai do caminho critico

- deploy separado de API Python
- manutencao de runtime Python para o core
- configuracoes extras de CORS entre frontend e backend proprio
- dependencia de Railway para manter o produto principal no ar

## Ordem sugerida de migracao

1. Preparar o frontend para operar em `modo Supabase`
2. Criar schema inicial do banco no Supabase
3. Migrar autenticacao
4. Migrar perfis
5. Migrar tracks e splits
6. Migrar contratos, imports e relatorios
7. Remover as ultimas dependencias da API Python

## Regra de decisao daqui pra frente

Se uma funcionalidade puder viver bem com:

- tabela
- relacao
- policy
- storage
- query direta pelo frontend

ela deve nascer no Supabase, e nao em uma API Python nova.
