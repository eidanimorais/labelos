# Setup do Supabase passo a passo

## Objetivo

Deixar o `label-os` rodando com:

- `Vercel` no frontend
- `Supabase` como backend principal

Sem depender da API Python para o funcionamento do produto principal.

## Parte 1: variaveis na Vercel

No projeto `web` da Vercel, em `Settings` > `Environment Variables`, deixe estas variaveis:

```txt
VITE_APP_BACKEND=supabase
VITE_SUPABASE_URL=https://hiwnwklqznrmzxdhlwyq.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key do projeto>
```

Use a chave `Publishable key`.

Nao use no frontend:

- `secret key`
- `service_role`

## Parte 2: criar o schema inicial

No painel do Supabase:

1. Abra o projeto
2. Clique em `SQL Editor`
3. Clique em `New query`
4. Cole o conteudo de `supabase/migrations/20260407_initial_core.sql`
5. Clique em `Run`

Arquivo para copiar:

- [`supabase/migrations/20260407_initial_core.sql`](/Users/daniel/Documents/coding/label-os/supabase/migrations/20260407_initial_core.sql)

## Parte 3: confirmar que as tabelas nasceram

Depois de rodar o SQL:

1. Abra `Table Editor`
2. Confirme se estas tabelas existem:
   - `profiles`
   - `works`
   - `tracks`
   - `splits`
   - `work_splits`
   - `imports`
   - `transactions`
   - `contracts`

## Parte 4: redeploy do frontend

Depois que as variaveis estiverem salvas na Vercel:

1. Abra `Deployments`
2. Faça `Redeploy` no deploy mais recente

## Parte 5: o que vamos migrar primeiro

A ordem recomendada agora e:

1. autenticacao
2. perfis
3. tracks
4. splits

Esses quatro blocos ja sao suficientes para tirar o projeto do eixo da API Python e levar o core para a arquitetura simples.

## Observacao de seguranca

Se chaves sensiveis foram expostas fora do painel do Supabase, rotacione:

- `secret key`
- `service_role`

A `publishable key` pode ser usada no frontend.
