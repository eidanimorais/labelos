
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.models import Track

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

DATABASE_URL = "sqlite:////Users/daniel/Documents/DEV/royalties/royalties.db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

isrc = "QZ5AB1971255"
track = db.query(Track).filter(Track.isrc == isrc).first()

if track:
    print(f"✅ Found Track: {track.title}")
    print(f"ISRC: {track.isrc}")
    print(f"Details: {track.artist} - {track.album}")
    print(f"Audio URL: {track.master_audio_url}")
    print(f"Cover URL: {track.master_cover_url}")
else:
    print(f"❌ Track {isrc} not found in DB.")
