#!/bin/bash
# Script para iniciar o Bot do Telegram com um clique
# Ao clicar duas vezes neste arquivo no Finder, ele abrirá o terminal e rodará o bot.

# Define o diretório de trabalho como o local onde o script está
cd "$(dirname "$0")"

clear
echo "========================================"
echo "🤖 INICIANDO BOT DO TELEGRAM (@labelosbot)"
echo "========================================"
echo ""

# Tenta ativar o ambiente virtual
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "❌ Erro: Ambiente virtual .venv não encontrado."
    echo "Tente rodar o comando de instalação primeiro."
    read -p "Pressione Enter para fechar..."
    exit 1
fi

# Roda o bot
echo "🚀 O bot já está online! Pode mandar mensagens no Telegram."
echo "(Pressione CTRL+C para parar o bot)"
echo ""
python3 bot_telegram_rules_gemini.py

# Se o bot cair ou for parado
echo ""
echo "----------------------------------------"
echo "🛑 Bot finalizado."
echo "Pressione qualquer tecla para sair..."
read -n 1 -s
exit 0
