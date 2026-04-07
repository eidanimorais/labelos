import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database', 'royalties.db')

def add_column_if_not_exists(cursor, table, column, col_type):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
        print(f"Added column {column} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {column} already exists in {table}")
        else:
            print(f"Error adding {column}: {e}")

def main():
    print(f"Connecting to {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    columns_to_add = [
        ("audio_engineer", "TEXT"),
        ("mixing_engineer", "TEXT"),
        ("mastering_engineer", "TEXT"),
        ("release_time_platforms", "TEXT"),
        ("release_time_youtube", "TEXT"),
        ("isrc_video", "TEXT"),
        ("explicit", "TEXT"),
        ("author_contact", "TEXT"),
        ("album", "TEXT"),
        ("track_number", "INTEGER"),
        ("format", "TEXT")
    ]

    for col, col_type in columns_to_add:
        add_column_if_not_exists(cursor, "tracks", col, col_type)

    conn.commit()
    conn.close()
    print("Database schema update completed.")

if __name__ == "__main__":
    main()
