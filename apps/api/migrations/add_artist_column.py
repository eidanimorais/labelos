from sqlalchemy import create_engine, text
import os

# Adjust path to handle execution from root or subdirectory
DB_PATH = "royalties.db"
if not os.path.exists(DB_PATH):
    # Try looking in parent dirs if running from subdir (though we run from root)
    if os.path.exists("../royalties.db"):
        DB_PATH = "../royalties.db"
    elif os.path.exists("../../royalties.db"):
        DB_PATH = "../../royalties.db"

def migrate():
    print(f"Migrating database at {DB_PATH} from {os.getcwd()}...")
    engine = create_engine(f"sqlite:///{DB_PATH}")
    
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("PRAGMA table_info(tracks)"))
            columns = [row[1] for row in result]
            
            if 'artist' not in columns:
                print("Adding 'artist' column to 'tracks' table...")
                conn.execute(text("ALTER TABLE tracks ADD COLUMN artist VARCHAR"))
                print("Column 'artist' added successfully.")
            else:
                print("Column 'artist' already exists.")
                
            conn.commit()
            print("Migration complete.")
            
        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
