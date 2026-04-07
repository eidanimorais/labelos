import sqlite3
import os

# Path to database
DB_PATH = "data/db/royalties.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(imports)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "distributor" not in columns:
            print("Adding 'distributor' column to 'imports' table...")
            cursor.execute("ALTER TABLE imports ADD COLUMN distributor TEXT")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column 'distributor' already exists.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
