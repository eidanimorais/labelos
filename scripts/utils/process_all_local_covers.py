from PIL import Image
import os
import sqlite3
from slugify import slugify

# Config
SOURCE_DIR = "/Users/daniel/Documents/DEV/royalties/frontend/public/images/capa"
DB_PATH = "royalties.db"

def run():
    print(f"Scanning {SOURCE_DIR}...")
    
    # 1. Get all PNGs
    files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith('.png')]
    print(f"Found {len(files)} PNG images.")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 2. Get all tracks and create a slug map
    # We fetch ID, ISRC, and Display Name
    cursor.execute("SELECT id, isrc, musica_display FROM tracks")
    tracks = cursor.fetchall()
    
    # Map: slug(title) -> list of ISRCs (since multiple tracks can have same title)
    track_map = {}
    for t_id, t_isrc, t_name in tracks:
        if t_name:
            s_name = slugify(t_name)
            if s_name not in track_map:
                track_map[s_name] = []
            track_map[s_name].append(t_isrc)
            
    # Also handle some edge cases or manual overrides if needed, but let's trust slugify for now.
    
    processed_count = 0
    updated_tracks = 0

    for filename in files:
        name_part = os.path.splitext(filename)[0] # e.g. "nao-me-entrego"
        file_slug = slugify(name_part) # Ensure filename is also slugified standardly
        
        # Check match
        matched_isrcs = track_map.get(file_slug)
        
        if matched_isrcs:
            print(f"Matched '{filename}' to {len(matched_isrcs)} tracks (Slug: {file_slug})")
            
            # Convert
            source_path = os.path.join(SOURCE_DIR, filename)
            webp_filename = os.path.splitext(filename)[0] + ".webp"
            target_path = os.path.join(SOURCE_DIR, webp_filename)
            
            try:
                # Only convert if webp doesn't exist or we want to force overwrite (user said "trabalhe", so let's overwrite to ensure 500x500)
                img = Image.open(source_path)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                img.thumbnail((500, 500), Image.Resampling.LANCZOS)
                img.save(target_path, "WEBP", quality=80)
                
                # Update DB
                public_url = f"/images/capa/{webp_filename}"
                
                for isrc in matched_isrcs:
                    cursor.execute("UPDATE tracks SET cover_image = ? WHERE isrc = ?", (public_url, isrc))
                    updated_tracks += 1
                
                processed_count += 1
                
            except Exception as e:
                print(f"Error processing {filename}: {e}")
        else:
            print(f"Skipped '{filename}' - No matching track found for slug '{file_slug}'")

    conn.commit()
    conn.close()
    
    print(f"\nSummary: Processed {processed_count} images, Updated {updated_tracks} track records.")

if __name__ == "__main__":
    run()
