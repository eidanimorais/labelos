import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'db', 'royalties.db')

def add_column_if_not_exists(cursor, table, column, col_type):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
        print(f"Added column {column} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {column} already exists in {table}")
        else:
            print(f"Error adding {column}: {e}")

def create_table_if_not_exists(cursor, create_query):
    try:
        cursor.execute(create_query)
        print("Created table work_splits if it didn't exist")
    except sqlite3.OperationalError as e:
        print(f"Error creating table: {e}")

def main():
    print(f"Connecting to {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Track Updates
    track_cols = [
        ("p_line", "TEXT"),
        ("c_line", "TEXT"),
        ("grid", "TEXT"),
        ("display_artist", "TEXT")
    ]
    for col, col_type in track_cols:
        add_column_if_not_exists(cursor, "tracks", col, col_type)

    # Profile Updates
    profile_cols = [
        ("ipi", "TEXT"),
        ("isni", "TEXT")
    ]
    for col, col_type in profile_cols:
        add_column_if_not_exists(cursor, "profiles", col, col_type)

    # Work Updates
    work_cols = [
        ("genre", "TEXT"),
        ("creation_date", "DATETIME")
    ]
    for col, col_type in work_cols:
        add_column_if_not_exists(cursor, "works", col, col_type)

    # New Table: WorkSplit
    work_splits_table = """
    CREATE TABLE IF NOT EXISTS work_splits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_id INTEGER,
        profile_id INTEGER,
        participant_name TEXT,
        role TEXT DEFAULT 'Composer',
        writer_type TEXT DEFAULT 'CA',
        share FLOAT,
        FOREIGN KEY(work_id) REFERENCES works(id),
        FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );
    """
    create_table_if_not_exists(cursor, work_splits_table)

    conn.commit()
    conn.close()
    print("Database schema updated for CWR/DDEX compliance.")

if __name__ == "__main__":
    main()
