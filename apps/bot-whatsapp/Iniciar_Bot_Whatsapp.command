#!/bin/bash
cd "$(dirname "$0")"

echo "--- Iniciando Bot de WhatsApp (Royalties) ---"

# Verifica se existe ambiente virtual
if [ ! -d ".venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv .venv
fi

# Ativa ambiente virtual
source .venv/bin/activate

# Instala/Atualiza dependências
echo "Verificando dependências..."
pip install -q -r requirements.txt

# Verifica arquivo .env
if [ ! -f ".env" ]; then
    echo "AVISO: Arquivo .env não encontrado!"
    echo "Criando um modelo .env-template..."
    echo "WHATSAPP_VERIFY_TOKEN=seu_token_aqui" > .env
    echo "WHATSAPP_ACCESS_TOKEN=seu_access_token_aqui" >> .env
    echo "WHATSAPP_PHONE_NUMBER_ID=seu_phone_id_aqui" >> .env
    echo "MAIN_DB_PATH=../database/royalties.db" >> .env
    echo "Edite o arquivo .env com suas credenciais da Meta."
fi

echo "Iniciando Webhook na porta 8080..."
python3 whatsapp_webhook.py
