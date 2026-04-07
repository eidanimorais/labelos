
import os
import sys
import boto3
from botocore.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.models import Track
from backend.database import Base

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

# DB Config
DATABASE_URL = "sqlite:////Users/daniel/Documents/DEV/royalties/royalties.db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

FILES_TO_UPLOAD = [
    "QZFYZ2288459.wav",
    "QZFZ32360980.wav",
    "QZFZ62271556.wav"
]
UPLOAD_DIR = "/Users/daniel/Documents/DEV/royalties/uploads"

def upload_v3():
    account_id = os.getenv("R2_V3_ACCOUNT_ID")
    key = os.getenv("R2_V3_ACCESS_KEY_ID")
    secret = os.getenv("R2_V3_SECRET_ACCESS_KEY")
    bucket = os.getenv("R2_V3_BUCKET_NAME")
    domain = os.getenv("R2_V3_PUBLIC_DOMAIN")

    if not all([account_id, key, secret, bucket]):
        print("V3 not configured.")
        return

    client = boto3.client(
        's3',
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=key,
        aws_secret_access_key=secret,
        region_name="auto",
        config=Config(s3={"addressing_style": "virtual"})
    )

    print(f"Uploading to {bucket} (V3)...")

    for filename in FILES_TO_UPLOAD:
        file_path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            continue

        file_size = os.path.getsize(file_path)
        print(f"Uploading {filename} ({file_size / (1024*1024):.2f} MB)...")

        try:
            with open(file_path, "rb") as f:
                # Use new 'audio/' folder standard
                r2_key = f"audio/{filename}"
                
                client.put_object(
                    Bucket=bucket,
                    Key=r2_key,
                    Body=f,
                    ContentType="audio/wav"
                )
                
                url = f"{domain}/{r2_key}"
                print(f"✅ Uploaded: {url}")

                # Update DB
                # Extract ISRC from filename (remove .wav)
                isrc = filename.replace(".wav", "")
                
                # Check for tracks with this ISRC (exact match)
                track = db.query(Track).filter(Track.isrc == isrc).first()
                
                if track:
                    track.master_audio_url = url
                    db.commit()
                    print(f"  -> DB Updated for ISRC {isrc}")
                else:
                    # Fallback: check if filename is part of master_audio_url or try to find by similarity?
                    # Ideally the filename IS the ISRC in this workflow as implied by user context.
                    print(f"  -> ⚠️ Track with ISRC {isrc} not found in DB.")

        except Exception as e:
            print(f"❌ Error uploading {filename}: {e}")

if __name__ == "__main__":
    upload_v3()
