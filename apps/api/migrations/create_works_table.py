import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'royalties.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print(f"Migrating database at {db_path}...")

    # Create works table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        iswc TEXT,
        iswc_link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('CREATE INDEX IF NOT EXISTS ix_works_id ON works (id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS ix_works_title ON works (title)')
    cursor.execute('CREATE INDEX IF NOT EXISTS ix_works_iswc ON works (iswc)')

    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
