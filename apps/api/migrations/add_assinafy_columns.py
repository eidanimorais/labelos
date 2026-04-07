
from sqlalchemy import create_engine, text
import os

# Pointing to the correct database location based on database.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# royalties.db seems to be in the root of backend or in a database folder. 
# Listing existing files showed royalties.db in backend root
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'royalties.db')}"

def migrate_contracts_table():
    print(f"Connecting to database at {SQLALCHEMY_DATABASE_URL}...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as conn:
        print("Migrating contracts table...")
        
        # Check if columns exist (simple check by trying to add them, ignoring error if exists, 
        # or better: select * limit 1 and check columns)
        
        try:
            conn.execute(text("ALTER TABLE contracts ADD COLUMN assinafy_id VARCHAR"))
            print("Added column assinafy_id")
        except Exception as e:
            print(f"Column assinafy_id might already exist: {e}")

        try:
            conn.execute(text("ALTER TABLE contracts ADD COLUMN status VARCHAR DEFAULT 'Rascunho'"))
            print("Added column status")
        except Exception as e:
            print(f"Column status might already exist: {e}")
            
        try:
            conn.execute(text("ALTER TABLE contracts ADD COLUMN signers_info TEXT"))
            print("Added column signers_info")
        except Exception as e:
            print(f"Column signers_info might already exist: {e}")
        
        print("Contracts table migration completed!")

if __name__ == "__main__":
    migrate_contracts_table()
