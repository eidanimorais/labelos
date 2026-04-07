from sqlalchemy import create_engine, inspect
import sys
import os

# Add parent directory to path
sys.path.append(os.getcwd())

from backend.database import SQLALCHEMY_DATABASE_URL
from backend import models

def check_schema():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    inspector = inspect(engine)
    columns = inspector.get_columns('profiles')
    print("Columns in 'profiles' table:")
    for col in columns:
        print(f"- {col['name']} ({col['type']})")

if __name__ == "__main__":
    check_schema()
