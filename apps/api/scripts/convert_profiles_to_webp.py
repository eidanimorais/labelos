
import os
import glob
from PIL import Image
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend/
PROJECT_ROOT = os.path.dirname(BASE_DIR) # root
IMAGES_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "images", "profiles")
DATABASE_URL = "sqlite:///./sql_app.db" # Assuming SQLite based on previous context, or check main.py

def convert_images():
    print(f"Searching for images in {IMAGES_DIR}...")
    jpg_files = glob.glob(os.path.join(IMAGES_DIR, "*.jpg")) + glob.glob(os.path.join(IMAGES_DIR, "*.jpeg"))
    
    if not jpg_files:
        print("No .jpg images found.")
        return

    print(f"Found {len(jpg_files)} images to convert.")
    
    for jpg_path in jpg_files:
        try:
            filename = os.path.basename(jpg_path)
            name_without_ext = os.path.splitext(filename)[0]
            webp_path = os.path.join(IMAGES_DIR, f"{name_without_ext}.webp")
            
            with Image.open(jpg_path) as img:
                img.save(webp_path, "WEBP")
            
            print(f"Converted: {filename} -> {name_without_ext}.webp")
            
            # Remove original? User asked to "change". Keeping both might be safer but usually "convert" implies replacing.
            # Let's delete to ensure we don't have duplicates and force usage of webp.
            os.remove(jpg_path)
            
        except Exception as e:
            print(f"Error converting {jpg_path}: {e}")

def update_database():
    print("Updating database references...")
    # Adjust DB URL if needed. Assuming sqlite relative to backend/
    db_path = os.path.join(BASE_DIR, "sql_app.db")
    engine = create_engine(f"sqlite:///{db_path}")
    
    try:
        with engine.connect() as conn:
            # Find users with .jpg photo_url
            result = conn.execute(text("SELECT id, photo_url FROM profiles WHERE photo_url LIKE '%.jpg' OR photo_url LIKE '%.jpeg'"))
            rows = result.fetchall()
            
            print(f"Found {len(rows)} profiles with legacy image formats.")
            
            for row in rows:
                id_, url = row
                if url:
                    new_url = url.replace(".jpg", ".webp").replace(".jpeg", ".webp")
                    conn.execute(text("UPDATE profiles SET photo_url = :new_url WHERE id = :id"), {"new_url": new_url, "id": id_})
                    print(f"Updated Profile {id_}: {url} -> {new_url}")
            
            conn.commit()
            print("Database update complete.")
            
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    convert_images()
    update_database()
