
import sys
import os
import csv
from sqlalchemy.orm import Session

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track

def update_iswcs_from_csv():
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads', 'akashi-cruz-iswc.csv')
    
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    db = SessionLocal()
    try:
        updated_count = 0
        not_found = []
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader) # Skip header
            
            for row in reader:
                if len(row) < 2:
                    continue
                    
                title_raw = row[0].strip()
                iswc = row[1].strip()
                
                if not title_raw or not iswc:
                    continue
                    
                # Clean title (remove " (feat. ...)" etc if needed?)
                # Try exact match first
                track = db.query(Track).filter(Track.title.ilike(title_raw)).first()
                
                if not track:
                    # Try partial match if not found? Or clean quotes?
                    clean_title = title_raw.replace('"', '')
                    track = db.query(Track).filter(Track.title.ilike(clean_title)).first()
                    
                if track:
                    if track.iswc != iswc:
                        print(f"Updating '{track.title}': {track.iswc} -> {iswc}")
                        track.iswc = iswc
                        updated_count += 1
                else:
                    not_found.append(title_raw)
        
        db.commit()
        print(f"\nTotal Updated: {updated_count}")
        print(f"Not Found: {len(not_found)}")
        for nf in not_found:
            print(f" - {nf}")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_iswcs_from_csv()
