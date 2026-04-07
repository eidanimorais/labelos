# Mapeamento das Aplicações Paralelas (Apps)

Este documento descreve as aplicações que estão na pasta `apps/` mas atuam de forma isolada ou independente como microsserviços paralelos à estrutura central da plataforma **LABEL OS** (composta pelas pastas `api` e `web`).

Abaixo, detalhamos a função de cada um desses *workers* criados paralelamente.

---

## 1. Bot do Telegram (`bot-telegram`)
**Objetivo:** Facilitar o upload e cadastro de novos lançamentos de maneira rápida via mensagens do Telegram.

**O que faz:**
- Oecta e interpreta mensagens de texto enviadas ao bot (ex: "Música: X, Artista: Y, Data: Z") utilizando IA (Google Gemini Model) para extrair os dados e organizar o lançamento.
- Permite o recebimento de arquivos de imagem (Capa/Artwork) e áudio (`.wav` ou `.mp3`).
- Ao receber as informações, o bot envia os arquivos brutos diretamente para os buckets da Cloudflare (R2 - V3 e V5).
- Registra diretamente os dados do lançamento interpretados na base de dados SQLite.

## 2. Bot do WhatsApp (`bot-whatsapp`)
**Objetivo:** Funciona de forma similar ao bot do Telegram, mas atua como um Webhook conectado na Cloud API oficial da Meta (WhatsApp Business).

**O que faz:**
- Recebe mensagens de WhatsApp com os dados do lançamento e permite o anexo de mídias (documentos de áudio e imagens de capa).
- Utiliza Inteligência Artificial (Google Gemini) para conseguir interpretar os textos livres (NLP) e estruturar os cadastros automaticamente.
- Faz também o upload nativo das mídias recebidas no WhatsApp direto para o armazenamento (R2 da Cloudflare) e salva as informações estruturadas no banco de dados.

## 3. Rastreador de Streams do Spotify (`spotify-stream-tracker`)
**Objetivo:** Um Web Scraper robusto de automação para raspar, armazenar e relatar a quantidade acumulada de streams diários do Spotify sem a necessidade do uso da API comercial oficial.

**O que faz:**
- Lê uma planilha de links de músicas (`tracks.csv`).
- Trabalha com um script no ambiente Node.js / Playwright (`scrape.js`) onde abre o navegador para verificar as estatísticas de cada música manualmente.
- Salva os dados em um banco de dados independente em SQLite (`db.sqlite`).
- (Opcional) Possui integração configurável com o Google Sheets, publicando e refletindo esses acessos e streams rastreados direto em uma aba diária compartilhada e em nuvem.
- Usa um Launch Daemon de macOS (via `launchd` com arquivo `.plist`) para que este script rode invisivelmente todos os dias de maneira automatizada pela própria máquina hospedeira.

## 4. Worker do YouTube Analytics (`worker-yt`)
**Objetivo:** Trabalhador paralelo (script em Python) construído focado em construir uma inteligência de dados atualizando metadados de vídeos através da API oficial de Dados do YouTube (v3).

**O que faz:**
- Puxa dados de uma planilha/CSV (como `videos.csv` e outros).
- Varre o histórico de exibições (views), curtidas, e contagem de comentários e preenche as informações em rotinas contínuas.
- Mantém seu próprio banco paralelo chamado `yt_views.db` de acompanhamento com a persistência de crescimento diário nas métricas.

---
## Classificacao oficial

### Nucleo do LabelOS
- `apps/api`
- `apps/web`

### Apps paralelas / satelites
- `apps/bot-telegram`
- `apps/bot-whatsapp`
- `apps/spotify-stream-tracker`
- `apps/worker-yt`

Estas apps satelites nao devem ser tratadas como parte obrigatoria do deploy inicial do LabelOS. Elas podem virar funcionalidades futuras, mas hoje devem ser pensadas como servicos independentes.

*Nota: As ramificações `api` (Backend do Label OS), `web` (Frontend do Label OS), `uploads` (Apenas pasta) e `extratos` (Vazia) fazem parte do núcleo da plataforma principal ou estão inativas e portanto não entram na lista das rotinas independentes acima.*
