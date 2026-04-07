
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Profile
from backend.auth_utils import get_password_hash

def set_fuub_password():
    db = SessionLocal()
    try:
        u = db.query(Profile).filter(Profile.name == "Fuub").first()
        if u:
            u.hashed_password = get_password_hash("fuub")
            db.commit()
            print("Password for 'Fuub' set to 'fuub'")
        else:
            print("Profile 'Fuub' not found")
    finally:
        db.close()

if __name__ == "__main__":
    set_fuub_password()
