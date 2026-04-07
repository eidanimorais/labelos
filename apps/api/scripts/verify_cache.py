import os
import sys
from sqlalchemy import func

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal
from backend import models

def verify_cache():
    db = SessionLocal()
    try:
        # Get top 5 tracks directly from Track table using cache fields
        tracks = db.query(models.Track).order_by(models.Track.cached_revenue.desc()).limit(5).all()
        
        print(f"{'Title':<30} | {'Cached Streams':<15} | {'Cached Revenue':<15}")
        print("-" * 65)
        for t in tracks:
            print(f"{t.title[:30]:<30} | {t.cached_streams:<15} | {t.cached_revenue:<15.2f}")

    finally:
        db.close()

if __name__ == "__main__":
    verify_cache()
