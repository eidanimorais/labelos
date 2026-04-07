
import csv
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.database import SessionLocal
from backend import models
from sqlalchemy import func

def normalize_title(title):
    if not title:
        return ""
    return title.strip().lower()

def import_iswcs():
    db = SessionLocal()
    csv_path = os.path.join(os.path.dirname(__file__), '../uploads/fuub-iswc.csv')
    
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    updated_count = 0
    not_found_count = 0
    skipped_count = 0

    print("Starting ISWC import...")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        # Handle the specific header from the file
        # Header: "Titulo Principal (103 encontradas),ISWC"
        # csv.DictReader keys will be the header strings
        
        # Verify headers
        fieldnames = reader.fieldnames
        print(f"CSV Headers: {fieldnames}")
        
        title_col = [col for col in fieldnames if 'Titulo' in col][0]
        iswc_col = 'ISWC'

        for row in reader:
            title = row.get(title_col)
            iswc = row.get(iswc_col)

            if not iswc or not iswc.strip():
                skipped_count += 1
                continue

            normalized_search_title = normalize_title(title)
            
            # Try to find the track
            # Using ILIKE for case-insensitive match
            track = db.query(models.Track).filter(
                func.lower(models.Track.title) == normalized_search_title
            ).first()

            if track:
                if track.iswc != iswc.strip():
                    print(f"Updating '{title}': {track.iswc} -> {iswc}")
                    track.iswc = iswc.strip()
                    updated_count += 1
                else:
                    print(f"Skipping '{title}': ISWC already matches")
            else:
                # Try partial match or exact match on clean title?
                # For now just log not found
                print(f"Track not found: {title}")
                not_found_count += 1

    db.commit()
    db.close()
    
    print("-" * 30)
    print(f"Import Complete.")
    print(f"Updated: {updated_count}")
    print(f"Not Found: {not_found_count}")
    print(f"Skipped (No ISWC in CSV): {skipped_count}")

if __name__ == "__main__":
    import_iswcs()
