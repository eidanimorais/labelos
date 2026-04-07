import sqlite3

def migrate():
    conn = sqlite3.connect('royalties.db')
    cursor = conn.cursor()
    
    print("Starting migration...")
    
    # 1. Disable Foreign Keys
    cursor.execute("PRAGMA foreign_keys=OFF")
    
    # 2. Begin Transaction
    cursor.execute("BEGIN TRANSACTION")
    
    try:
        # 3. Create new table (Schema based on previous inspection, without work_id)
        # Note: We keep iswc as TEXT REFERENCES works(iswc)
        cursor.execute("""
        CREATE TABLE tracks_new (
            id INTEGER PRIMARY KEY,
            isrc VARCHAR UNIQUE,
            title VARCHAR,
            artist_name VARCHAR,
            version VARCHAR DEFAULT 'Original',
            artist_id INTEGER,
            iswc VARCHAR REFERENCES works(iswc),
            cover_url VARCHAR,
            master_audio_url VARCHAR,
            master_cover_url VARCHAR,
            release_date VARCHAR,
            duration VARCHAR,
            label_share FLOAT DEFAULT 0.40,
            label_name VARCHAR DEFAULT 'GRAV Produção Musical Ltda.',
            cached_streams INTEGER DEFAULT 0,
            cached_revenue FLOAT DEFAULT 0.0,
            production_cost FLOAT DEFAULT 0.0,
            display_status VARCHAR DEFAULT 'Live',
            genre VARCHAR,
            composer VARCHAR,
            publisher VARCHAR,
            upc VARCHAR,
            bpm INTEGER,
            "key" VARCHAR,
            producer VARCHAR,
            audio_engineer VARCHAR,
            album VARCHAR,
            track_number INTEGER,
            format VARCHAR,
            FOREIGN KEY(artist_id) REFERENCES profiles(id)
        )
        """)
        
        # 4. Copy data
        # We need to list columns explicitly to avoid mismatch
        # Current columns in tracks (order might vary, so identifying common columns)
        # We select everything EXCEPT work_id.
        # tracks has 'iswc' now because of the previous ADD COLUMN.
        
        # Get list of columns from current tracks
        cursor.execute("PRAGMA table_info(tracks)")
        columns_info = cursor.fetchall()
        columns = [info[1] for info in columns_info if info[1] != 'work_id']
        
        columns_str = ", ".join([f'"{c}"' for c in columns])
        
        print(f"Copying columns: {columns_str}")
        
        cursor.execute(f"INSERT INTO tracks_new ({columns_str}) SELECT {columns_str} FROM tracks")
        
        # 5. Drop old table
        cursor.execute("DROP TABLE tracks")
        
        # 6. Rename new table
        cursor.execute("ALTER TABLE tracks_new RENAME TO tracks")
        
        # 7. Recreate Indices
        cursor.execute("CREATE INDEX ix_tracks_id ON tracks (id)")
        cursor.execute("CREATE INDEX ix_tracks_title ON tracks (title)")
        cursor.execute("CREATE UNIQUE INDEX ix_tracks_isrc ON tracks (isrc)")
        # Add index for iswc if desired, mostly good for FK
        cursor.execute("CREATE INDEX ix_tracks_iswc ON tracks (iswc)")
        
        conn.commit()
        print("Migration successful!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        raise
    finally:
        cursor.execute("PRAGMA foreign_keys=ON")
        conn.close()

if __name__ == "__main__":
    migrate()
