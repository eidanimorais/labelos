
import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track

def update_genres():
    db = SessionLocal()
    try:
        tracks = db.query(Track).all()
        print(f"Encontradas {len(tracks)} faixas.")
        
        count = 0
        for track in tracks:
            track.genre = "Hip-Hop/Rap"
            count += 1
            
        db.commit()
        print(f"Atualizadas {count} faixas para o gênero 'Hip-Hop/Rap'.")
        
    except Exception as e:
        print(f"Erro ao atualizar gêneros: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_genres()
