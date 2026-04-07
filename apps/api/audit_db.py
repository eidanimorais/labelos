from sqlalchemy import create_engine, inspect
from database import SQLALCHEMY_DATABASE_URL

if "sqlite:///" in SQLALCHEMY_DATABASE_URL and not "absolute" in SQLALCHEMY_DATABASE_URL:
    # Quick fix for relative path if running from same dir
    import os
    if not os.path.exists("royalties.db"):
        print("royalties.db not found in current dir!")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
inspector = inspect(engine)

print("Tables found:", inspector.get_table_names())

for table in inspector.get_table_names():
    print(f"\nColumns in {table}:")
    for col in inspector.get_columns(table):
        print(f" - {col['name']} ({col['type']})")
