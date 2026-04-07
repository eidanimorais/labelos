
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import SQLALCHEMY_DATABASE_URL
from backend.models import Profile

def delete_profile(name):
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        profile = session.query(Profile).filter(Profile.name.ilike(name)).first()
        if profile:
            session.delete(profile)
            session.commit()
            print(f"Successfully deleted profile: {profile.name}")
        else:
            print(f"Profile '{name}' not found.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    delete_profile("Lil Fuub")
