
import requests
import sys
import os
from sqlalchemy.orm import Session

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track

def fetch_deezer_metadata(query_artist, query_track):
    url = f"https://api.deezer.com/search?q=artist:'{query_artist}' track:'{query_track}'"
    print(f"Searching Deezer: {url}")
    try:
        resp = requests.get(url)
        data = resp.json()
        if data.get('data'):
            return data['data'][0]
    except Exception as e:
        print(f"Error fetching from Deezer: {e}")
    return None

def update_missing_covers():
    db = SessionLocal()
    try:
        # Find tracks without cover
        tracks = db.query(Track).filter((Track.cover_url == None) | (Track.cover_url == "")).all()
        print(f"Found {len(tracks)} tracks without cover.")
        
        for track in tracks:
            print(f"Processing: {track.title} - {track.artist_name}")
            
            # Heuristic: Use artist_name or fallback
            artist = track.artist_name or (track.artist.name if track.artist else "")
            
            # Remove "feat." etc for better search
            clean_title = track.title.split("(")[0].strip()
            
            metadata = fetch_deezer_metadata(artist, clean_title)
            
            if metadata:
                cover = metadata.get('album', {}).get('cover_xl') or metadata.get('album', {}).get('cover_medium')
                if cover:
                    print(f"  Found Cover: {cover}")
                    track.cover_url = cover
                    
                    # Also update other fields if missing
                    if not track.isrc and metadata.get('isrc'):
                        track.isrc = metadata.get('isrc')
                    if not track.album and metadata.get('album', {}).get('title'):
                        track.album = metadata.get('album', {}).get('title')
                        
                    db.commit()
                else:
                    print("  No cover in metadata.")
            else:
                print("  No results found on Deezer.")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_missing_covers()
