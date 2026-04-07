import sys
import os

# Adicionar o diretório raiz do projeto ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal
from backend import models

def check_titles(titles):
    db = SessionLocal()
    try:
        for title in titles:
            tracks = db.query(models.Track).filter(models.Track.title.ilike(f"%{title}%")).all()
            if not tracks:
                print(f"--- Title '{title}' not found in tracks! ---")
            for t in tracks:
                print(f"Found: Title='{t.title}' | Artist='{t.artist.name if t.artist else 'Unknown'}' | ISRC='{t.isrc}'")
    finally:
        db.close()

if __name__ == "__main__":
    check_titles(["+1", "365 Dias"])
