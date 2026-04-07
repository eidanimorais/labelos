import sqlite3
import os

DB_PATH = "../../royalties.db"

def migrate():
    print(f"Migrating database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # List of columns to check/add
    columns_to_add = [
        ("label_share", "FLOAT DEFAULT 0.40"),
        ("label_name", "VARCHAR DEFAULT 'GRAV Produção Musical Ltda.'"),
        ("release_date", "VARCHAR"),
        ("duration", "VARCHAR")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            print(f"Attemping to add column '{col_name}'...")
            cursor.execute(f"ALTER TABLE tracks ADD COLUMN {col_name} {col_type}")
            print(f"SUCCESS: Added column '{col_name}'")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"SKIPPED: Column '{col_name}' already exists.")
            else:
                print(f"ERROR: Could not add column '{col_name}': {e}")
                
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
    else:
        migrate()
