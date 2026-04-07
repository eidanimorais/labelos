import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import SessionLocal
import models
from sqlalchemy import func
from datetime import datetime

db = SessionLocal()
start_date = datetime(2026, 1, 8)
end_date = datetime(2026, 2, 4)

print(f"Querying range: {start_date} to {end_date}")

track = db.query(models.Track).filter(models.Track.title.ilike("%Apaixono Por Vadias%")).first()

if track:
    print(f"Track: {track.title} (ID: {track.id})")
    
    total = db.query(func.sum(models.DailyAnalytics.total_streams))\
        .filter(
            models.DailyAnalytics.track_id == track.id,
            models.DailyAnalytics.date >= start_date,
            models.DailyAnalytics.date <= end_date
        ).scalar()
    
    print(f"Total Streams (Jan 8 - Feb 4): {total}")
    
    # Check bounds details
    jan7 = db.query(func.sum(models.DailyAnalytics.total_streams)).filter(models.DailyAnalytics.track_id==track.id, models.DailyAnalytics.date==datetime(2026, 1, 7)).scalar()
    jan8 = db.query(func.sum(models.DailyAnalytics.total_streams)).filter(models.DailyAnalytics.track_id==track.id, models.DailyAnalytics.date==datetime(2026, 1, 8)).scalar()
    feb4 = db.query(func.sum(models.DailyAnalytics.total_streams)).filter(models.DailyAnalytics.track_id==track.id, models.DailyAnalytics.date==datetime(2026, 2, 4)).scalar()
    feb5 = db.query(func.sum(models.DailyAnalytics.total_streams)).filter(models.DailyAnalytics.track_id==track.id, models.DailyAnalytics.date==datetime(2026, 2, 5)).scalar()
    
    print(f"Jan 7: {jan7}")
    print(f"Jan 8: {jan8}")
    print(f"Feb 4: {feb4}")
    print(f"Feb 5: {feb5}")

else:
    print("Track not found")
