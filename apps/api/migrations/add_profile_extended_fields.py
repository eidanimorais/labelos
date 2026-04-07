import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "royalties.db")

def migrate():
    print(f"Connecting to database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    columns = [
        ("label_name", "VARCHAR"),
        ("association", "VARCHAR"),
        ("publisher_extra", "VARCHAR")
    ]

    for col_name, col_type in columns:
        try:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE profiles ADD COLUMN {col_name} {col_type}")
            print(f"Column {col_name} added successfully.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding column {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
