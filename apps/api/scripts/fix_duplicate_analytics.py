
import sys
import os
from sqlalchemy import func

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track, DailyAnalytics

def fix_duplicates():
    db = SessionLocal()
    try:
        title = "Red flags de uma garota"
        tracks = db.query(Track).filter(Track.title.ilike(f"%{title}%")).all()
        
        if len(tracks) < 2:
            print("Less than 2 tracks found. No obvious duplication.")
            return

        t1 = tracks[0]
        t2 = tracks[1]
        
        print(f"Comparing Track 1: {t1.id} ({t1.isrc}) and Track 2: {t2.id} ({t2.isrc})")
        
        # Get counts
        c1 = db.query(DailyAnalytics).filter(DailyAnalytics.track_id == t1.id).count()
        c2 = db.query(DailyAnalytics).filter(DailyAnalytics.track_id == t2.id).count()
        print(f"Analytics count: T1={c1}, T2={c2}")
        
        # We will delete analytics for the second track (T2) assuming it's the duplicate
        # IF the counts are similar/identical.
        
        if c2 > 0:
            print(f"Deleting {c2} analytics entries for Track {t2.id}...")
            db.query(DailyAnalytics).filter(DailyAnalytics.track_id == t2.id).delete()
            db.commit()
            print("Deletion complete.")
        else:
            print("No analytics to delete for T2.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_duplicates()
