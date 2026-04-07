
import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import SQLALCHEMY_DATABASE_URL

def fix_photo():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("UPDATE profiles SET photo_url = NULL WHERE name = 'Akashi Cruz'"))
            conn.commit()
            print("Cleared photo_url for Akashi Cruz")
            
            # Verify
            result = conn.execute(text("SELECT id, name, photo_url FROM profiles WHERE name = 'Akashi Cruz'"))
            for row in result:
                print(f"Verified -> ID: {row.id}, Name: {row.name}, Photo: {row.photo_url}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    fix_photo()
