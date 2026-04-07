
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track

def debug_track():
    db = SessionLocal()
    try:
        # Search for "Suco de Maracujá"
        track = db.query(Track).filter(Track.title.ilike("Suco de Maracujá")).first()
        
        if not track:
            print("Track not found.")
            return

        print(f"--- Track Data: {track.title} ---")
        print(f"ID: {track.id}")
        print(f"ISRC: {track.isrc}")
        print(f"Album: '{track.album}'")
        print(f"Track #: '{track.track_number}'")
        print(f"Format: '{track.format}'")
        print(f"Producer: '{track.producer}'")
        print(f"Composer: '{track.composer}'")
        print(f"Duration: '{track.duration}'")
        print(f"Genre: '{track.genre}'")

    finally:
        db.close()

if __name__ == "__main__":
    debug_track()
