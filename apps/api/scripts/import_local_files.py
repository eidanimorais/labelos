
import os
import sys
import boto3
import mimetypes
import unicodedata
from botocore.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend headers
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.models import Track, Base

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

# DB Config
DATABASE_URL = "sqlite:////Users/daniel/Documents/DEV/royalties/royalties.db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# R2 Config (Targeting V4 as requested)
ACCOUNT_ID = os.getenv("R2_V4_ACCOUNT_ID")
ACCESS_KEY = os.getenv("R2_V4_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("R2_V4_SECRET_ACCESS_KEY")
BUCKET_NAME = os.getenv("R2_V4_BUCKET_NAME")
PUBLIC_DOMAIN = os.getenv("R2_V4_PUBLIC_DOMAIN")

if not all([ACCOUNT_ID, ACCESS_KEY, SECRET_KEY, BUCKET_NAME]):
    print("❌ R2 V4 credentials not fully configured.")
    sys.exit(1)

s3 = boto3.client(
    's3',
    endpoint_url=f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name="auto",
    config=Config(s3={"addressing_style": "virtual"})
)

ROOT_DIR = "/Users/daniel/Documents/DEV/royalties/uploads/musica"

def upload_file(file_path, r2_key, content_type):
    try:
        with open(file_path, 'rb') as f:
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=r2_key,
                Body=f,
                ContentType=content_type
            )
        return f"{PUBLIC_DOMAIN}/{r2_key}"
    except Exception as e:
        print(f"❌ Upload failed for {r2_key}: {e}")
        return None

def normalize_text(text):
    if not text: return ""
    return unicodedata.normalize('NFC', text)

def process_directory():
    print(f"📂 Scanning {ROOT_DIR}...")
    
    success_count = 0
    fail_count = 0

    # Walk: Artist / Track / Files
    for artist_name in os.listdir(ROOT_DIR):
        artist_path = os.path.join(ROOT_DIR, artist_name)
        if not os.path.isdir(artist_path): continue
        if artist_name.startswith('.'): continue

        print(f"\n🎤 Artist: {artist_name}")
        
        for track_title in os.listdir(artist_path):
            track_path = os.path.join(artist_path, track_title)
            if not os.path.isdir(track_path): continue
            
            # 1. Find Track in DB
            normalized_title = normalize_text(track_title)
            
            # Try plain query first (exact match)
            track = db.query(Track).filter(Track.title == track_title).first()
            
            # If failed, try normalized
            if not track:
                 track = db.query(Track).filter(Track.title == normalized_title).first()
            
            if not track:
                print(f"  ⚠️  Track not found in DB: '{track_title}'")
                fail_count += 1
                continue
                
            print(f"  ✅ Found Track: {track.title} ({track.isrc})")
            
            # 2. Look for Audio and Cover in the folder
            audio_path = None
            cover_path = None
            
            for f in os.listdir(track_path):
                if f.lower().endswith('.wav'):
                    audio_path = os.path.join(track_path, f)
                elif f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    cover_path = os.path.join(track_path, f)
            
            # 3. Upload Audio
            if audio_path:
                ext = os.path.splitext(audio_path)[1]
                key = f"audio/{track.isrc}{ext}" # audio/ISRC.wav
                print(f"    found audio: {os.path.basename(audio_path)}")
                
                url = upload_file(audio_path, key, 'audio/wav')
                if url:
                    track.master_audio_url = url
                    print(f"    🚀 Uploaded Audio -> {url}")
            
            # 4. Upload Cover
            if cover_path:
                ext = os.path.splitext(cover_path)[1]
                mime = mimetypes.guess_type(cover_path)[0] or 'image/jpeg'
                key = f"cover/{track.isrc}{ext}" # cover/ISRC.jpg
                print(f"    found cover: {os.path.basename(cover_path)}")
                
                url = upload_file(cover_path, key, mime)
                if url:
                    track.cover_url = url
                    track.master_cover_url = url 
                    print(f"    🚀 Uploaded Cover -> {url}")

            db.commit()
            success_count += 1

    print(f"\nSummary: {success_count} processed, {fail_count} failed to match DB.")

if __name__ == "__main__":
    process_directory()
