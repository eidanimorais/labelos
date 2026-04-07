#!/bin/bash
# Script para execução simples do YT Tracker
# Ao clicar duas vezes neste arquivo no Finder, ele abrirá o terminal e rodará tudo.

# Define o diretório de trabalho como o local onde o script está
cd "$(dirname "$0")"

echo "========================================"
echo "🚀 INICIANDO COLETA DO YOUTUBE TRACKER"
echo "========================================"
echo ""

# Tenta ativar o ambiente virtual
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "❌ Erro: Ambiente virtual .venv não encontrado."
    echo "Por favor, rode o comando de instalação primeiro."
    read -p "Pressione Enter para fechar..."
    exit 1
fi

# Roda o rastreador
python3 tracker.py

# Roda a exportação
echo ""
echo "----------------------------------------"
python3 export_csv.py
echo "----------------------------------------"

echo ""
echo "✅ Concluído com sucesso!"
echo "Os dados foram salvos no banco e o CSV foi gerado na pasta 'exports'."
echo ""

# Opcional: abre a pasta de exportação
# open exports/

echo "Pressione qualquer tecla para sair..."
read -n 1 -s
exit 0
