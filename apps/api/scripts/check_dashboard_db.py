import os
import sys
from sqlalchemy import func
from sqlalchemy.orm import Session

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal
from backend import models

def check_dashboard_data():
    db = SessionLocal()
    try:
        # Check top 10 tracks like the dashboard does
        top_tracks = db.query(
            models.Track.id,
            models.Track.title,
            models.Track.artist_id,
            func.max(models.Transaction.raw_artist).label("max_raw"),
            func.sum(models.Transaction.royalties_value).label("total")
        ).join(models.Track, models.Transaction.track_id == models.Track.id)\
         .group_by(models.Track.id)\
         .order_by(func.sum(models.Transaction.royalties_value).desc())\
         .limit(10).all()
        
        print(f"{'ID':<4} | {'Title':<30} | {'ArtID':<6} | {'Raw Artist':<30} | {'Revenue':<10}")
        print("-" * 90)
        for t in top_tracks:
            # Check if profile exists
            profile_name = "N/A"
            if t.artist_id:
                profile = db.query(models.Profile).filter(models.Profile.id == t.artist_id).first()
                if profile:
                    profile_name = profile.name
            
            print(f"{t.id:<4} | {t.title[:30]:<30} | {str(t.artist_id):<6} | {str(t.max_raw)[:30]:<30} | {t.total:<10.2f}")
            print(f"      -> Profile Name: {profile_name}")

    finally:
        db.close()

if __name__ == "__main__":
    check_dashboard_data()
