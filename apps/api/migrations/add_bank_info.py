from sqlalchemy import create_engine, text
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("Adding bank columns to profiles table...")
        
        # Add columns one by one (SQLite doesn't support multiple ADD COLUMN in one statement usually, though newer versions might)
        columns = [
            ("bank", "VARCHAR"),
            ("agency", "VARCHAR"),
            ("account", "VARCHAR"),
            ("pix", "VARCHAR")
        ]
        
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE profiles ADD COLUMN {col_name} {col_type}"))
                print(f"Added column: {col_name}")
            except Exception as e:
                # Ignore if column exists
                if "duplicate column name" in str(e).lower():
                    print(f"Column {col_name} already exists.")
                else:
                    print(f"Error adding {col_name}: {e}")
                    
        conn.commit()
    print("Migration Complete.")

if __name__ == "__main__":
    migrate()
