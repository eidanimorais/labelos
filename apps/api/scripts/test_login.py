
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Profile
from backend.auth_utils import verify_password
from backend.routers.auth import login_for_access_token # Verify import works

def test_login_simulation():
    db = SessionLocal()
    try:
        username = "admin"
        password = "admin"
        
        print(f"Testing login for user: '{username}' with password: '{password}'")
        
        user = db.query(Profile).filter(Profile.name == username).first()
        
        if not user:
            print("User not found in DB query.")
            return
            
        print(f"User found: ID={user.id}, Name='{user.name}'")
        print(f"Stored Hash: {user.hashed_password[:10]}...")
        
        is_valid = verify_password(password, user.hashed_password)
        print(f"Password Valid? {is_valid}")
        
        if is_valid:
            print("LOGIN SHOULD SUCCESS")
        else:
            print("LOGIN FAILURE - Hash mismatch")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_login_simulation()
