import sqlite3
import os

DB_PATH = 'royalties.db'

def list_tables(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print("Tables:", cursor.fetchall())

def add_column_if_not_exists(conn, table, column, col_type):
    cursor = conn.cursor()
    # Check if column exists
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [info[1] for info in cursor.fetchall()]
    
    if column not in columns:
        print(f"Adding {column} to {table}...")
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            conn.commit()
            print("Done.")
        except Exception as e:
            print(f"Error adding {column}: {e}")
    else:
        print(f"Column {column} already exists in {table}.")

def main():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    
    list_tables(conn)
    
    # Add columns to 'tracks'
    add_column_if_not_exists(conn, 'tracks', 'label_share', 'FLOAT DEFAULT 0.4')
    add_column_if_not_exists(conn, 'tracks', 'label_name', 'TEXT DEFAULT "Main Street Records"')
    
    conn.close()

if __name__ == "__main__":
    main()
