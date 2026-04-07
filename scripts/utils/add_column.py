import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('royalties.db')
cursor = conn.cursor()

try:
    # Add parent_track_id column to tracks table
    cursor.execute("ALTER TABLE tracks ADD COLUMN parent_track_id INTEGER REFERENCES tracks(id)")
    print("Column 'parent_track_id' added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

conn.commit()
conn.close()
