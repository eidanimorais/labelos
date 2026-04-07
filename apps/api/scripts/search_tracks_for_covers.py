import sys
import os

# Adicionar o diretório raiz do projeto ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal
from backend import models

def search_tracks(query):
    db = SessionLocal()
    try:
        tracks = db.query(models.Track).filter(models.Track.title.ilike(f"%{query}%")).all()
        for t in tracks:
            artist = t.artist.name if t.artist else "Unknown"
            print(f"ID: {t.id} | Title: {t.title} | Artist: {artist} | ISRC: {t.isrc}")
    finally:
        db.close()

if __name__ == "__main__":
    queries = ["Pizza", "Carti", "Shaquille", "Collab", "Maho", "Garota de Status", "Brilho Muito", "Succubus", "Chuva", "Quem é você", "Times Square", "Conta essa história"]
    for q in queries:
        print(f"\n--- Searching for: {q} ---")
        search_tracks(q)
