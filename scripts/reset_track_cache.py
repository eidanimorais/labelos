import sys
import os

# Add project root to sys.path
sys.path.append(os.getcwd())

from apps.api.database import SessionLocal, engine
from apps.api import models

def reset_cache():
    db = SessionLocal()
    try:
        print("Resetting cached_streams and cached_revenue for all tracks...")
        rows = db.query(models.Track).update({
            models.Track.cached_streams: 0, 
            models.Track.cached_revenue: 0.0
        })
        db.commit()
        print(f"Successfully reset cache for {rows} tracks.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_cache()
