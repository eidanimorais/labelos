
from sqlalchemy import create_engine, text
import os

# Database Path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# DB is in root, not backend/
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "royalties.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

def run_migration():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking for existing columns...")
        # Check if columns exist to avoid error
        try:
            conn.execute(text("SELECT cpf FROM profiles LIMIT 1"))
            print("Columns already exist. Skipping.")
            return
        except:
            print("Columns missing. Adding them now...")

        # Add columns
        alter_statements = [
            "ALTER TABLE profiles ADD COLUMN cpf VARCHAR",
            "ALTER TABLE profiles ADD COLUMN email VARCHAR",
            "ALTER TABLE profiles ADD COLUMN address VARCHAR",
            "ALTER TABLE profiles ADD COLUMN zip_code VARCHAR",
            "ALTER TABLE profiles ADD COLUMN publisher VARCHAR"
        ]

        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
                print(f"Executed: {stmt}")
            except Exception as e:
                print(f"Error executing {stmt}: {e}")

    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
