import csv
import sqlite3
import os
import glob
from datetime import datetime
import difflib

# Configuration
UPLOADS_DIR = "uploads"
DB_PATH = "royalties.db"

def connect_db():
    return sqlite3.connect(DB_PATH)

def find_best_match(query, choices_map, cutoff=0.9):
    # choices_map: {title: id}
    query_norm = query.lower().strip()
    titles = list(choices_map.keys())
    
    best_match = None
    best_score = 0.0
    
    for title in titles:
        ratio = difflib.SequenceMatcher(None, query_norm, title).ratio()
        if ratio >= cutoff and ratio > best_score:
            best_score = ratio
            best_match = title
            
    if best_match:
        return choices_map[best_match], best_match, best_score
    return None, None, 0.0

def import_csv(file_path):
    print(f"Processing: {file_path}")
    
    conn = connect_db()
    cursor = conn.cursor()
    
    # Load tracks for matching
    cursor.execute("SELECT id, title FROM tracks")
    tracks = cursor.fetchall()
    # Map lowercase title to ID
    # Use dictionary for exact lookups
    tracks_map = {t[1].lower().strip(): t[0] for t in tracks}
    
    records_processed = 0
    records_inserted = 0
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            records_processed += 1
            
            # CSV Format: id,track_id,date,total_streams
            # track_id here seems to be the Title based on user sample "Red flags de uma garota"
            
            track_title = row.get('track_id')
            date_str = row.get('date')
            streams_str = row.get('total_streams')
            
            if not track_title or not date_str:
                continue
                
            try:
                streams = int(streams_str)
            except ValueError:
                continue
                
            # Match Track
            track_db_id = tracks_map.get(track_title.lower().strip())
            
            if not track_db_id:
                # Try fuzzy
                matched_id, _, score = find_best_match(track_title, tracks_map)
                if matched_id:
                    track_db_id = matched_id
                else:
                    # Retrieve unmatched titles for report if needed, for now just skip
                    # print(f"Unmatched: {track_title}")
                    continue
            
            # Check for existing record
            # We want to avoid duplicates for same track, date, platform
            
            # Using basic SQL
            cursor.execute("""
                SELECT id FROM daily_analytics 
                WHERE track_id = ? AND date = ? AND platform = 'Spotify'
            """, (track_db_id, date_str))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update? Or Skip?
                # User said "total_streams", usually cumulative.
                # If we are re-importing, updating is safer.
                cursor.execute("""
                    UPDATE daily_analytics 
                    SET total_streams = ? 
                    WHERE id = ?
                """, (streams, existing[0]))
            else:
                cursor.execute("""
                    INSERT INTO daily_analytics (track_id, date, platform, total_streams)
                    VALUES (?, ?, 'Spotify', ?)
                """, (track_db_id, date_str, streams))
                records_inserted += 1

            # Update cached_streams on track if this is the latest date we've seen?
            # Actually, user script does this.
            # But we can do a simple logic: compare current cached_streams.
            # If new streams > cached_streams, update it.
            # Or better: "last_updated" date check. 
            # For simplicity let's stick to importing analytics first.
            
    conn.commit()
    conn.close()
    print(f"Finished {file_path}: Processed {records_processed}, Inserted {records_inserted}")

def run():
    # Find all CSVs in uploads that end with "streams.csv" or just all CSVs?
    # User mentioned "red flags de uma garota - streams.csv"
    pattern = os.path.join(UPLOADS_DIR, "*streams.csv")
    files = glob.glob(pattern)
    
    if not files:
        print("No matching CSV files found in uploads/")
        return

    for file in files:
        import_csv(file)

if __name__ == "__main__":
    run()
