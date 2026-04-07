from PIL import Image
import os
import sqlite3

# Config
SOURCE_DIR = "/Users/daniel/Documents/DEV/royalties/frontend/public/images/capa"
FILENAME = "nao-me-entrego.png"
SEARCH_TERM = "Não me entrego"
DB_PATH = "royalties.db"

def run():
    source_path = os.path.join(SOURCE_DIR, FILENAME)
    webp_filename = os.path.splitext(FILENAME)[0] + ".webp"
    target_path = os.path.join(SOURCE_DIR, webp_filename)
    
    # 1. Convert to WebP
    try:
        print(f"Opening {source_path}...")
        img = Image.open(source_path)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        print("Resizing to 500x500...")
        img.thumbnail((500, 500), Image.Resampling.LANCZOS)
            
        print(f"Saving to {target_path}...")
        img.save(target_path, "WEBP", quality=80)
        print("Conversion successful.")
    except Exception as e:
        print(f"Error converting image: {e}")
        return

    # 2. Update Database
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Public URL format (relative to public folder)
        public_url = f"/images/capa/{webp_filename}"
        
        print(f"Updating tracks matching '{SEARCH_TERM}' to use cover '{public_url}'...")
        cursor.execute("UPDATE tracks SET cover_image = ? WHERE musica_display LIKE ?", (public_url, f'%{SEARCH_TERM}%'))
        
        print(f"Updated {cursor.rowcount} rows.")
        conn.commit()
        conn.close()
        
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    run()
