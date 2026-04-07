import sys
import os
import shutil
import unicodedata
import re

# Adicionar o diretório raiz do projeto ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal
from backend import models

CAPA_DIR = os.path.join(project_root, "frontend/public/images/capa")

def slugify(text):
    if not text: return ""
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text).lower().strip()
    return re.sub(r'[-\s]+', '-', text)

def smart_sync():
    db = SessionLocal()
    files = [f for f in os.listdir(CAPA_DIR) if f.endswith(".webp")]
    tracks = db.query(models.Track).all()
    
    # Map of expected slugs to tracks
    expected_slugs = {}
    for t in tracks:
        artist = t.artist.name if t.artist else "Unknown"
        track_slug = slugify(t.title)
        artist_slug = slugify(artist)
        full_slug = f"{artist_slug}-{track_slug}"
        expected_slugs[full_slug] = t
        
    print(f"Total Tracks in DB: {len(tracks)}")
    print(f"Total WebP files in folder: {len(files)}")
    
    renamed = 0
    not_found = []
    
    for filename in files:
        name_only = os.path.splitext(filename)[0]
        if name_only in expected_slugs:
            # Already correct
            continue
            
        # Try to find a track that matches this filename (partial match)
        # e.g. billie-jeans matches Billie
        found_sync = False
        for full_slug, track in expected_slugs.items():
            # If the track title slug is in the filename slug
            # e.g. "billie" in "billie-jeans"
            # OR "billie-jeans" contains "billie"
            title_slug = slugify(track.title)
            if title_slug in name_only and len(title_slug) > 3:
                # Potential match!
                old_path = os.path.join(CAPA_DIR, filename)
                new_filename = f"{full_slug}.webp"
                new_path = os.path.join(CAPA_DIR, new_filename)
                
                if not os.path.exists(new_path):
                    shutil.move(old_path, new_path)
                    print(f"✅ Sync: {filename} -> {new_filename} (Matched '{track.title}' by {track.artist.name if track.artist else '?'})")
                    renamed += 1
                    found_sync = True
                    break
        
        if not found_sync:
            not_found.append(filename)
            
    print(f"\n--- Sync Results ---")
    print(f"Renamed: {renamed}")
    print(f"Orphaned files (still not matching DB): {len(not_found)}")
    for f in not_found:
        print(f" - {f}")
        
    db.close()

if __name__ == "__main__":
    smart_sync()
