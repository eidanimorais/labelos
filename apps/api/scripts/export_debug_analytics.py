
import sys
import os
import csv
from sqlalchemy.orm import Session

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track, DailyAnalytics

def export_debug_analytics():
    db = SessionLocal()
    track_title = "Red Flags de uma Garota"
    
    tracks = db.query(Track).filter(Track.title.ilike(f"%{track_title}%")).all()
    if not tracks:
        print(f"Track '{track_title}' not found.")
        return

    print(f"Found {len(tracks)} tracks matching '{track_title}':")
    for t in tracks:
        print(f" - ID: {t.id} | Title: {t.title} | Artist: {t.artist_name}")
    
    # We will export analytics for ALL of them to see overlap
    analytics = db.query(DailyAnalytics).filter(DailyAnalytics.track_id.in_([t.id for t in tracks])).order_by(DailyAnalytics.track_id, DailyAnalytics.date).all()
    
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads', 'spotify_analitico_red_flags.csv')
    
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['ID', 'Track ID', 'Date', 'Total Streams', 'Source?', 'Import ID?'])
        
        for a in analytics:
            # Check if model has additional fields
            writer.writerow([a.id, a.track_id, a.date, a.total_streams])
            
    print(f"Exported {len(analytics)} rows to {output_path}")
    db.close()

if __name__ == "__main__":
    export_debug_analytics()
