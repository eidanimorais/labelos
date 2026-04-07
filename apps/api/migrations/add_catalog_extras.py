
from sqlalchemy import create_engine, text
import os

DB_PATH = "royalties.db"
if not os.path.exists(DB_PATH):
    if os.path.exists("backend/royalties.db"):
         DB_PATH = "backend/royalties.db"

def migrate():
    print(f"Migrating database at {DB_PATH}...")
    engine = create_engine(f"sqlite:///{DB_PATH}")
    
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(tracks)"))
            columns = [row[1] for row in result]
            
            # Album / Release Name
            if 'album' not in columns:
                print("Adding 'album' column...")
                conn.execute(text("ALTER TABLE tracks ADD COLUMN album VARCHAR"))
            
            # Track Number
            if 'track_number' not in columns:
                print("Adding 'track_number' column...")
                conn.execute(text("ALTER TABLE tracks ADD COLUMN track_number INTEGER"))
                
            # Format (Single, EP, Album)
            if 'format' not in columns:
                print("Adding 'format' column...")
                conn.execute(text("ALTER TABLE tracks ADD COLUMN format VARCHAR"))

            conn.commit()
            print("Migration complete.")
            
        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
