
import os
import sys
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from datetime import datetime

# Add backend headers
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.models import Track, DailyAnalytics, Base

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

# DB Config
DATABASE_URL = "sqlite:////Users/daniel/Documents/DEV/royalties/royalties.db"
# Fallback to absolute if env not set correctly or distinct
if not os.path.exists("/Users/daniel/Documents/DEV/royalties/royalties.db"):
    # Try the one in the current sandbox path
    DATABASE_URL = "sqlite:////Users/daniel/Documents/programacao/royalties/royalties.db"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

INPUT_DIR = "/Users/daniel/Documents/programacao/royalties/uploads/spotify-streams"

def normalize_title(title):
    return str(title).strip().lower()

def get_or_create_track(title, isrc_hint=None):
    # Try exact match
    track = db.query(Track).filter(Track.title.ilike(title)).first()
    if track:
        return track
    
    # If not found and we have a hint
    if isrc_hint:
        print(f"  Creating new track: {title} ({isrc_hint})")
        track = Track(title=title, isrc=isrc_hint, artist_name="Unknown", display_status="Live")
        db.add(track)
        db.commit()
        db.refresh(track)
        return track
        
    return None

def process_file(filepath):
    print(f"Processing {os.path.basename(filepath)}...")
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        print(f"  Error reading CSV: {e}")
        return

    # Check columns
    # Expected: 'track_id' (Title), 'date', 'total_streams' OR 'streams'
    cols = [c.lower() for c in df.columns]
    
    val_col = 'total_streams'
    if 'total_streams' not in cols:
        if 'streams' in cols:
            val_col = 'streams'
        else:
            print(f"  Skipping: Missing stream column. Found {df.columns}")
            return

    if 'track_id' not in cols or 'date' not in cols:
         # Try matching loose
         # But let's stick to strict or simple variations
         print(f"  Skipping: Missing critical columns. Found {df.columns}")
         return

    # Group by Title (though file usually contains one)
    titles = df['track_id'].unique()
    
    for title_raw in titles:
        if pd.isna(title_raw): continue
        
        # Hardcoded match for the user request
        isrc_hint = None
        clean_title = str(title_raw).strip()
        
        if "Nem sei mais amar" in clean_title:
            isrc_hint = "BC2GV2500483" # Primary ISRC
        
        track = get_or_create_track(clean_title, isrc_hint)
        
        if not track:
            print(f"  Skipping {clean_title}: Track not found and no ISRC hint.")
            continue
            
        print(f"  Importing for {track.title} (ID: {track.id})...")
        
        # Filter rows
        rows = df[df['track_id'] == title_raw]
        
        new_records = []
        for _, row in rows.iterrows():
            date_str = row['date']
            val = row[val_col]
            
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                val_int = int(val)
            except:
                continue
                
            # Check existing
            exists = db.query(DailyAnalytics).filter(
                DailyAnalytics.track_id == track.id,
                DailyAnalytics.date == date_obj
            ).first()
            
            if not exists:
                rec = DailyAnalytics(
                    track_id=track.id,
                    date=date_obj,
                    total_streams=val_int,
                    platform="Spotify"
                )
                new_records.append(rec)
            else:
                # Update if needed
                if exists.total_streams != val_int:
                    exists.total_streams = val_int
        
        if new_records:
            db.bulk_save_objects(new_records)
            db.commit()
            print(f"  Inserted {len(new_records)} records.")
        else:
            print("  No new records to insert.")

def main():
    if not os.path.exists(INPUT_DIR):
        print(f"Directory not found: {INPUT_DIR}")
        return

    for f in os.listdir(INPUT_DIR):
        if f.endswith("streams.csv"):
            process_file(os.path.join(INPUT_DIR, f))

if __name__ == "__main__":
    main()
