from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent directory to path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import Base, SQLALCHEMY_DATABASE_URL
from backend.models import Profile, Split, Track

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    # 1. Create Table if not exists
    print("Creating 'profiles' table...")
    Base.metadata.create_all(bind=engine)

    # 2. Extract distinct names from Splits and Tracks
    print("Extracting existing names...")
    
    existing_names = set()
    
    # Get all Split participant names
    splits = session.query(Split).all()
    for s in splits:
        if s.participant_name:
            # Handle comma separated lists just in case, though splits usually have single names
            names = [n.strip() for n in s.participant_name.replace(',', ';').split(';') if n.strip()]
            for n in names:
                existing_names.add(n)
                
    # Get all Track artist names
    tracks = session.query(Track).all()
    for t in tracks:
        if t.artist:
            names = [n.strip() for n in t.artist.replace(',', ';').split(';') if n.strip()]
            for n in names:
                existing_names.add(n)
    
    # 3. Seed Profiles
    print(f"Found {len(existing_names)} unique names. Seeding Profiles...")
    
    added_count = 0
    for name in existing_names:
        # Check if exists
        exists = session.query(Profile).filter(Profile.name.ilike(name)).first()
        if not exists:
            # Try to guess type/photo (simple heuristic or default)
            p_type = "artist"
            p_photo = None
            
            # Basic defaults for known demo users
            name_lower = name.lower()
            if "snif" in name_lower: p_photo = "/images/profiles/snif.jpg"
            elif "fuub" in name_lower: p_photo = "/images/profiles/fuub.jpg"
            elif "lil chainz" in name_lower: p_photo = "/images/profiles/lil-chainz.jpg"
            elif "grav" in name_lower: 
                p_type = "label"
            
            new_profile = Profile(name=name, type=p_type, photo_url=p_photo)
            session.add(new_profile)
            added_count += 1
            
    session.commit()
    print(f"Migration Complete. Added {added_count} new profiles.")
    session.close()

if __name__ == "__main__":
    migrate()
