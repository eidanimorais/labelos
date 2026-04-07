# Configuração do Bot de Telegram

## Variáveis de Ambiente (.env)
Crie um arquivo chamado `.env` na pasta `telegram-bot` com o seguinte conteúdo:

```env
TELEGRAM_BOT_TOKEN="SEU_TOKEN_AQUI"
GEMINI_API_KEY="SUA_CHAVE_GOOGLE_AQUI" # Opcional
BOT_DB_PATH="bot_events.db"
GEMINI_MODEL="gemini-1.5-flash"
```

## Como rodar
1. Ative o ambiente virtual:
   ```bash
   cd telegram-bot
   source .venv/bin/activate
   ```
2. Inicie o bot:
   ```bash
   python bot_telegram_rules_gemini.py
   ```

## Testando
No Telegram, mande uma mensagem como:
```
Artista Lil Chainz
Música: Coração Vermelho
23/02/2026
```
O bot responderá solicitando confirmação. Ao digitar "confirmar", ele salvará no banco de dados local `bot_events.db`.
