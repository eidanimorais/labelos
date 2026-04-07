from sqlalchemy import create_engine, text
from backend.database import SQLALCHEMY_DATABASE_URL

def optimize():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("Optimizing database...")
        
        # List of indexes to create
        indexes = [
            ("idx_transactions_territorio", "transactions", "territorio"),
            ("idx_transactions_import_id", "transactions", "import_id"),
            ("idx_transactions_plataforma", "transactions", "plataforma"),
            ("idx_splits_track_id", "splits", "track_id"),
        ]

        for idx_name, table, column in indexes:
            try:
                # Check if index exists (SQLite specific check could be done, but simpler to try/except or use 'IF NOT EXISTS')
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} ({column})"))
                print(f"Created index: {idx_name}")
            except Exception as e:
                print(f"Error creating index {idx_name}: {e}")
        
        print("Running VACUUM to optimize storage...")
        conn.execute(text("VACUUM"))
        print("Optimization complete.")

if __name__ == "__main__":
    optimize()
