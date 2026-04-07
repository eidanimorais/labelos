from sqlalchemy import create_engine, text
import sys
import os

# Add parent directory to path to import database config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database connection
from database import SQLALCHEMY_DATABASE_URL as DATABASE_URL

def create_table():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Creating label_settings table...")
        
        # Check if table exists
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='label_settings'"))
        if result.fetchone():
            print("Table 'label_settings' already exists.")
            return

        # Create table with all columns
        conn.execute(text("""
            CREATE TABLE label_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stage_name VARCHAR,
                legal_name VARCHAR,
                primary_identifier VARCHAR,
                bio TEXT,
                bank_code VARCHAR,
                branch_id VARCHAR,
                acc_number VARCHAR,
                tax_id_pix VARCHAR,
                spotify_url VARCHAR,
                instagram_url VARCHAR,
                youtube_url VARCHAR,
                website_url VARCHAR,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        print("Table 'label_settings' created successfully!")

        # Create initial row if empty
        conn.execute(text("""
            INSERT INTO label_settings (stage_name, legal_name, bio) 
            VALUES ('REAL PS', 'Admin Default', 'Initial Bio')
        """))
        print("Initial admin profile created.")

if __name__ == "__main__":
    create_table()
