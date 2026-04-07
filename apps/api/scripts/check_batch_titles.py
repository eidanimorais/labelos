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
                print(f"--- Title '{title}' NOT FOUND ---")
            for t in tracks:
                print(f"Title: '{t.title}' | Artist: '{t.artist.name if t.artist else 'Unknown'}'")
    finally:
        db.close()

if __name__ == "__main__":
    check_titles(["Amar", "365", "Billie Jeans", "Eu cansei", "Eu nao", "Lembra", "Low profile", "Mais foco", "Me chamar", "Me lembro", "Oi meu nome", "Preciso mudar", "Quando voce me", "Quero te dizer", "Voce merece", "Voce quebrou", "Voce so quer", "Voce tem muito"])
