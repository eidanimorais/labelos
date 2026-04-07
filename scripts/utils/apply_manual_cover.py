from PIL import Image
import os
import sqlite3
import shutil

IMAGE_PATH = "/Users/daniel/.gemini/antigravity/brain/ddf286a0-eea5-4f9c-b1bc-8b96e9f9594f/uploaded_image_1769190644700.png"
DB_PATH = "royalties.db"
SEARCH_TERM = "Não me entrego"
OUTPUT_DIR = "backend/static/covers"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_and_assign():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Find tracks
    cursor.execute("SELECT isrc, musica_display FROM tracks WHERE musica_display LIKE ?", (f'%{SEARCH_TERM}%',))
    tracks = cursor.fetchall()
    
    if not tracks:
        print("No tracks found.")
        return

    print(f"Found {len(tracks)} tracks: {[t[0] for t in tracks]}")
    
    # Open Image
    try:
        img = Image.open(IMAGE_PATH)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        # Resize
        img.thumbnail((800, 800), Image.Resampling.LANCZOS)
        
        for isrc, title in tracks:
            # Save file
            filename = f"{isrc}.webp"
            save_path = os.path.join(OUTPUT_DIR, filename)
            img.save(save_path, "WEBP", quality=80)
            print(f"Saved {save_path}")
            
            # Update DB
            db_url = f"/static/covers/{filename}"
            cursor.execute("UPDATE tracks SET cover_image = ? WHERE isrc = ?", (db_url, isrc))
            print(f"Updated DB for {isrc}")
            
        conn.commit()
        print("Done.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    process_and_assign()
