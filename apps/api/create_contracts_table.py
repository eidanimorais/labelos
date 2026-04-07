from sqlalchemy import create_engine, text
# from backend.database import SQLALCHEMY_DATABASE_URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./royalties.db"
import os

def create_contracts_table():
    print(f"Connecting to database at {SQLALCHEMY_DATABASE_URL}...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as conn:
        print("Creating contracts table...")
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR,
            contract_type VARCHAR,
            status VARCHAR DEFAULT 'Rascunho',
            party_a VARCHAR,
            party_b VARCHAR,
            file_path VARCHAR,
            track_id INTEGER,
            assinafy_id VARCHAR,
            signers_info TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(track_id) REFERENCES tracks(id)
        );
        """))
        
        # Create index on title and track_id
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_contracts_title ON contracts (title);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_contracts_id ON contracts (id);"))
        
        print("Contracts table created successfully!")

if __name__ == "__main__":
    create_contracts_table()
