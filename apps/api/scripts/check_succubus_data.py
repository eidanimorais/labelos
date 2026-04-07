
import sys
import os

# Adicionar o diretório raiz do projeto ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

def check_succubus():
    db = SessionLocal()
    try:
        track = db.query(models.Track).filter(models.Track.isrc == 'BC2GV2300060').first()
        if not track:
            print("Track BC2GV2300060 not found")
            return
            
        print(f"Track: {track.title}")
        print(f"ISRC: {track.isrc}")
        print(f"Artist ID: {track.artist_id}")
        if track.artist:
            print(f"Artist Profile Name: {track.artist.name}")
        else:
            print("Artist Profile: None")
            
        print("\nSplits:")
        for s in track.splits:
            print(f"- {s.participant_name} ({s.role}): {s.percentage}%")
            
        # Check all transactions for raw_artist
        transactions = db.query(models.Transaction).filter(models.Transaction.track_id == track.id).all()
        raw_artists = set(t.raw_artist for t in transactions if t.raw_artist)
        print(f"\nUnique Raw Artists in Transactions ({len(transactions)} trans):")
        for r in raw_artists:
            print(f"- {r}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_succubus()
