
import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import SQLALCHEMY_DATABASE_URL

def check_profiles():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, name, photo_url FROM profiles WHERE name LIKE '%Akashi%' OR name LIKE '%Chainz%'"))
        for row in result:
            print(f"ID: {row.id}, Name: {row.name}, Photo: {row.photo_url}")

if __name__ == "__main__":
    check_profiles()
