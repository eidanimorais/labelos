import sys
import os

# Adicionar o diretório raiz do projeto ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal
from backend import models

def search_raw_transactions(query):
    db = SessionLocal()
    try:
        results = db.query(models.Transaction.raw_track, models.Transaction.raw_artist)\
            .filter(models.Transaction.raw_track.ilike(f"%{query}%")).distinct().all()
        for track, artist in results:
            print(f"Track: {track} | Artist: {artist}")
    finally:
        db.close()

if __name__ == "__main__":
    queries = ["Pizza", "Collab", "Maho", "Garota de Status", "Quem é você", "Conta essa história"]
    for q in queries:
        print(f"\n--- Searching in Raw Transactions for: {q} ---")
        search_raw_transactions(q)
