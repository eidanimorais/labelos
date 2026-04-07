import sqlite3
import os

db_path = "/Users/daniel/Documents/programacao/royalties/backend/royalties.db"

def migrate():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("mixing_engineer", "TEXT"),
        ("mastering_engineer", "TEXT"),
        ("release_time_platforms", "TEXT"),
        ("release_time_youtube", "TEXT"),
        ("isrc_video", "TEXT"),
        ("explicit", "TEXT DEFAULT 'Não'"),
        ("author_contact", "TEXT")
    ]

    for col_name, col_type in columns_to_add:
        try:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE tracks ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            print(f"Column {col_name} already exists.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
