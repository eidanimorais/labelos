
import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE profiles ADD COLUMN full_name VARCHAR"))
            print("Added full_name column")
        except Exception as e:
            print(f"Skipping full_name: {e}")

        try:
            conn.execute(text("ALTER TABLE profiles ADD COLUMN bank VARCHAR"))
            print("Added bank column")
        except Exception as e:
            print(f"Skipping bank: {e}")

        try:
            conn.execute(text("ALTER TABLE profiles ADD COLUMN agency VARCHAR"))
            print("Added agency column")
        except Exception as e:
            print(f"Skipping agency: {e}")

        try:
            conn.execute(text("ALTER TABLE profiles ADD COLUMN account VARCHAR"))
            print("Added account column")
        except Exception as e:
            print(f"Skipping account: {e}")

        try:
            conn.execute(text("ALTER TABLE profiles ADD COLUMN pix VARCHAR"))
            print("Added pix column")
        except Exception as e:
            print(f"Skipping pix: {e}")

if __name__ == "__main__":
    migrate()
