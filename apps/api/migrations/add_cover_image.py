from sqlalchemy import create_engine, text
import os

# Adjust path to handle execution from root or subdirectory
DB_PATH = "royalties.db"
if not os.path.exists(DB_PATH):
    if os.path.exists("../royalties.db"):
        DB_PATH = "../royalties.db"
    elif os.path.exists("../../royalties.db"):
        DB_PATH = "../../royalties.db"
    elif os.path.exists("backend/royalties.db"):
        DB_PATH = "backend/royalties.db"

def migrate():
    print(f"Migrating database at {DB_PATH} from {os.getcwd()}...")
    engine = create_engine(f"sqlite:///{DB_PATH}")
    
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("PRAGMA table_info(tracks)"))
            columns = [row[1] for row in result]
            
            if 'cover_image' not in columns:
                print("Adding 'cover_image' column to 'tracks' table...")
                conn.execute(text("ALTER TABLE tracks ADD COLUMN cover_image VARCHAR"))
                print("Column 'cover_image' added successfully.")
            else:
                print("Column 'cover_image' already exists.")
                
            conn.commit()
            print("Migration complete.")
            
        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
