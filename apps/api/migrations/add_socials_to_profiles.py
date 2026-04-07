from sqlalchemy import create_engine, text
import sys
import os

# Add parent directory to path to import database config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SQLALCHEMY_DATABASE_URL as DATABASE_URL

def add_columns():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Adding social columns to profiles table...")
        
        columns = [
            ("bio", "TEXT"),
            ("spotify_url", "VARCHAR"),
            ("instagram_url", "VARCHAR"),
            ("youtube_url", "VARCHAR"),
            ("website_url", "VARCHAR")
        ]
        
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE profiles ADD COLUMN {col_name} {col_type}"))
                print(f"Added column {col_name}")
            except Exception as e:
                print(f"Column {col_name} might already exist: {e}")
                
        print("Migration complete.")

if __name__ == "__main__":
    add_columns()
