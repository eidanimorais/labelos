import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'db', 'royalties.db')

def check_table_exists(cursor, table_name):
    cursor.execute(f"SELECT count(*) FROM sqlite_master WHERE type='table' AND name='{table_name}'")
    if cursor.fetchone()[0] == 1:
        print(f"PASS: Table '{table_name}' exists.")
    else:
        print(f"FAIL: Table '{table_name}' does not exist.")

def check_column_exists(cursor, table_name, column_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [info[1] for info in cursor.fetchall()]
    if column_name in columns:
        print(f"PASS: Column '{column_name}' exists in '{table_name}'.")
    else:
        print(f"FAIL: Column '{column_name}' not found in '{table_name}'.")

def main():
    if not os.path.exists(DB_PATH):
        print(f"FAIL: Database file not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Verifying Schema Changes...")
    
    # Check WorkSplit table
    check_table_exists(cursor, "work_splits")

    # Check Track columns
    for col in ["p_line", "c_line", "grid", "display_artist"]:
        check_column_exists(cursor, "tracks", col)

    # Check Profile columns
    for col in ["ipi", "isni"]:
        check_column_exists(cursor, "profiles", col)

    # Check Work columns
    for col in ["genre", "creation_date"]:
        check_column_exists(cursor, "works", col)

    conn.close()

if __name__ == "__main__":
    main()
