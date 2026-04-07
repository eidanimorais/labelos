
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Profile
from backend.auth_utils import get_password_hash

def reset_admin():
    db = SessionLocal()
    try:
        # Reset 'admin'
        u1 = db.query(Profile).filter(Profile.name == "admin").first()
        if u1:
            u1.hashed_password = get_password_hash("admin")
            print("Password for 'admin' reset to 'admin'")
            
        # Reset 'Admin'
        u2 = db.query(Profile).filter(Profile.name == "Admin").first()
        if u2:
            u2.hashed_password = get_password_hash("admin")
            print("Password for 'Admin' reset to 'admin'")
            
        db.commit()
            
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
