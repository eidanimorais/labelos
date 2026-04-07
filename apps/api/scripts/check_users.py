
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Profile

def check_users():
    db = SessionLocal()
    try:
        users = db.query(Profile).filter(Profile.is_admin == "admin").all()
        print(f"Found {len(users)} admin users:")
        for u in users:
            print(f" - Username: '{u.name}' (Type: {u.type})")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
