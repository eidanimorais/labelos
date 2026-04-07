from sqlalchemy import create_engine, text
import sys
import os

# Add parent directory to path to import database config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SQLALCHEMY_DATABASE_URL as DATABASE_URL

def add_apple_music_column():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Adding apple_music_url column to profiles table...")
        
        try:
            conn.execute(text("ALTER TABLE profiles ADD COLUMN apple_music_url VARCHAR"))
            print("Added column apple_music_url")
        except Exception as e:
            print(f"Column might already exist or error: {e}")
                
        print("Migration complete.")

if __name__ == "__main__":
    add_apple_music_column()
