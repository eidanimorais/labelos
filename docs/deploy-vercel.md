# Deploy do Frontend na Vercel

## Escopo inicial

O primeiro deploy recomendado e do frontend em `apps/web`.

## Configuracao sugerida do projeto

- Root Directory: `apps/web`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Variaveis de ambiente

- `VITE_API_BASE_URL`: URL publica da API

## Observacoes

- O frontend depende de uma API publica para funcionar de verdade.
- Sem uma API hospedada, o deploy da Vercel sobe, mas as telas que carregam dados vao falhar nas chamadas HTTP.
- Como o app usa React Router, mantivemos `vercel.json` em `apps/web` para reescrever rotas para `index.html`.

## Proxima etapa recomendada

- Hospedar a API fora da Vercel ou adaptar parte dela para serverless
- Depois apontar `VITE_API_BASE_URL` para esse endpoint

## Quando a API for hospedada

No ambiente hospedado da API, a recomendacao e usar:

- `ALLOW_INSECURE_AUTH=false`
- `AUTO_CREATE_TABLES=false` quando houver uma rotina de migracao mais controlada
