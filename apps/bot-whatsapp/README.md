# WhatsApp Bot - Royalties System

Este bot permite o cadastro de músicas e upload de arquivos (Capa e Áudio) diretamente via WhatsApp utilizando a **WhatsApp Cloud API (Meta)**.

## Como Configurar

1.  **Meta Developers**: Crie um App do tipo "Business" no [Meta for Developers](https://developers.facebook.com/).
2.  **WhatsApp**: Adicione o produto WhatsApp ao seu App.
3.  **Configuração do Webhook**:
    -   **URL de Retorno**: Como a Meta exige HTTPS, use um túnel (instruções abaixo).
    -   **Token de Verificação**: O que você definir no seu `.env` (`WHATSAPP_VERIFY_TOKEN`).
    -   **Campos de Inscrição**: Marque **messages**.

## Como Expor o Bot Localmente (HTTPS Grátis)

Você não precisa de uma VPS agora. Pode usar seu Mac M4 com um destes túneis:

### Opção A: Cloudflare Tunnel (Recomendado)
1. Instale: `brew install cloudflared`
2. Rode: `cloudflared tunnel --url http://localhost:8080`
3. Copie a URL `https://...trycloudflare.com` e use no painel da Meta.

### Opção B: ngrok
1. Instale: `brew install ngrok/ngrok/ngrok`
2. Rode: `ngrok http 8080`
3. Copie a URL `https://...ngrok-free.app` e use no painel da Meta.

**Importante**: Lembre-se de adicionar `/webhook` ao final da URL no painel da Meta (ex: `https://seu-tunnel.com/webhook`).
4.  **Variáveis de Ambiente**:
    -   Crie ou edite o arquivo `.env` com as seguintes chaves:
        ```env
        WHATSAPP_VERIFY_TOKEN="sua_chave_escolhida"
        WHATSAPP_ACCESS_TOKEN="token_gerado_pela_meta"
        WHATSAPP_PHONE_NUMBER_ID="id_do_numero_no_painel_meta"
        GEMINI_API_KEY="..."
        MAIN_DB_PATH="../database/royalties.db"
        ```

## Como Executar

No Mac, basta abrir o arquivo:
**`Iniciar_Bot_Whatsapp.command`**

Ele cuidará de criar o ambiente virtual, instalar as dependências e rodar o servidor na porta **8080**.

## Comandos Suportados

-   **Texto**: "Artista: X, Música: Y, Data: Z" -> Inicia o cadastro.
-   **Imagens**: Envie a arte da capa (com ou sem legenda).
-   **Documentos**: Envie arquivos `.wav` ou `.mp3`.
-   **Ações**: Digite "confirmar" para salvar no banco ou "cancelar" para desistir.
