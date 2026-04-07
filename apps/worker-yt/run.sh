#!/bin/bash
# Script para rodar a coleta e exportação do YT Tracker
cd "$(dirname "$0")"
source .venv/bin/activate
python3 tracker.py
python3 export_csv.py
deactivate
