#!/bin/bash
cd "$(dirname "$0")"
PATH=$PATH:/opt/homebrew/bin
node scrape.js
echo "Processo finalizado! Pode fechar esta janela."
read -p "Pressione ENTER para sair..."
