# Limites do Produto

## Nucleo do LabelOS

Estas pastas compoem o produto principal:

- `apps/api`
- `apps/web`

## Apps satelites

Estas pastas representam apps paralelas, workers ou automacoes independentes. Elas podem inspirar funcionalidades futuras, mas nao fazem parte do nucleo operacional atual do LabelOS:

- `apps/bot-telegram`
- `apps/bot-whatsapp`
- `apps/spotify-stream-tracker`
- `apps/worker-yt`

## Regra pratica para deploy

- Deploy principal do produto: considerar apenas `apps/api` e `apps/web`
- Apps satelites: tratar como servicos separados, experimentais ou futuros candidatos a integracao

## Regra pratica para migracao de banco

- Migracao para Supabase deve cobrir primeiro o banco do nucleo do produto
- Bancos locais de bots, trackers e workers nao entram no escopo inicial da migracao do LabelOS

