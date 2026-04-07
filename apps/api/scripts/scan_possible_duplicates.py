
import sys
import os
from sqlalchemy import func

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track, DailyAnalytics

def scan_duplicates():
    db = SessionLocal()
    try:
        # Find titles with multiple tracks
        dupes_q = db.query(Track.title, func.count(Track.id))\
            .group_by(Track.title)\
            .having(func.count(Track.id) > 1)\
            .all()
        
        print(f"Found {len(dupes_q)} titles with multiple tracks/ISRCs.")
        
        for title, count in dupes_q:
            # Get tracks for this title
            tracks = db.query(Track).filter(Track.title == title).all()
            if len(tracks) < 2: continue
            
            # Compare analytics for the first date available in common?
            # Or just check if total_streams are identical for a sample date?
            
            # Quick check: Check total streams sum in Global DB? No.
            # Let's check matching analytics count.
            
            t1 = tracks[0]
            # Check others against t1
            
            # Fetch last date for t1
            last_entry_t1 = db.query(DailyAnalytics).filter(DailyAnalytics.track_id == t1.id).order_by(DailyAnalytics.date.desc()).first()
            if not last_entry_t1:
                continue
                
            for i in range(1, len(tracks)):
                t2 = tracks[i]
                # Check if t2 has entry for same date with same value
                match = db.query(DailyAnalytics).filter(
                    DailyAnalytics.track_id == t2.id,
                    DailyAnalytics.date == last_entry_t1.date,
                    DailyAnalytics.total_streams == last_entry_t1.total_streams
                ).first()
                
                if match:
                    print(f"[POTENTIAL DUPLICATE IMPORTS] Title: '{title}'")
                    print(f"  - Track {t1.id} ({t1.isrc}) and Track {t2.id} ({t2.isrc})")
                    print(f"  - Date: {last_entry_t1.date}, Value: {last_entry_t1.total_streams}")
                    print("  This might be causing double counting.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    scan_duplicates()
