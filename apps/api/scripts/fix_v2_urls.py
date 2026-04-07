
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.models import Track
from backend.database import Base

import dotenv
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

V2_DOMAIN = os.getenv("R2_V2_PUBLIC_DOMAIN")
if not V2_DOMAIN:
    print("V2 Domain not found in env!")
    sys.exit(1)

DATABASE_URL = "sqlite:////Users/daniel/Documents/DEV/royalties/royalties.db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

def fix_urls():
    # Fix Covers
    tracks = db.query(Track).filter(Track.cover_url.like("/%")).all()
    print(f"Found {len(tracks)} tracks with relative cover URLs.")
    for t in tracks:
        t.cover_url = f"{V2_DOMAIN}{t.cover_url}"
    
    # Fix Masters
    masters = db.query(Track).filter(Track.master_audio_url.like("/%")).all()
    print(f"Found {len(masters)} tracks with relative master URLs.")
    for t in masters:
        t.master_audio_url = f"{V2_DOMAIN}{t.master_audio_url}"

    db.commit()
    print("Relative URLs fixed.")

if __name__ == "__main__":
    fix_urls()
