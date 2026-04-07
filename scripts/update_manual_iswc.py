
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.database import SessionLocal
from backend import models
from sqlalchemy import func

def update_single_track():
    db = SessionLocal()
    
    # Specific update
    target_title = "Só Me Apaixono Por Vadias" # With Accent
    target_iswc = "T-336.776.956-6"
    
    track = db.query(models.Track).filter(
        models.Track.title == target_title
    ).first()
    
    if track:
        print(f"Found match: {track.title} (Current ISWC: {track.iswc})")
        if track.iswc != target_iswc:
            track.iswc = target_iswc
            db.commit()
            print(f"Updated to: {target_iswc}")
        else:
            print("ISWC is already correct.")
    else:
        # Try case insensitive search just in case
        print(f"Exact match not found for '{target_title}'. Trying case-insensitive...")
        track = db.query(models.Track).filter(
            func.lower(models.Track.title) == target_title.lower()
        ).first()
        
        if track:
            print(f"Found match: {track.title} (Current ISWC: {track.iswc})")
            track.iswc = target_iswc
            db.commit()
            print(f"Updated to: {target_iswc}")
        else:
            print("Track ABSOLUTELY NOT FOUND.")

    db.close()

if __name__ == "__main__":
    update_single_track()
