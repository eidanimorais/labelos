
import os
import sys
import boto3
from botocore.config import Config
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.models import Track
from backend.database import Base

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

# R2 Config
R2_V1_ID = os.getenv("R2_V1_ACCOUNT_ID")
R2_V1_KEY = os.getenv("R2_V1_ACCESS_KEY_ID")
R2_V1_SECRET = os.getenv("R2_V1_SECRET_ACCESS_KEY")
R2_V1_BUCKET = os.getenv("R2_V1_BUCKET_NAME")
R2_V1_DOMAIN = os.getenv("R2_V1_PUBLIC_DOMAIN")

R2_V3_ID = os.getenv("R2_V3_ACCOUNT_ID")
R2_V3_KEY = os.getenv("R2_V3_ACCESS_KEY_ID")
R2_V3_SECRET = os.getenv("R2_V3_SECRET_ACCESS_KEY")
R2_V3_BUCKET = os.getenv("R2_V3_BUCKET_NAME")
R2_V3_DOMAIN = os.getenv("R2_V3_PUBLIC_DOMAIN")

# DB Config
DATABASE_URL = "sqlite:////Users/daniel/Documents/DEV/royalties/royalties.db" # Adjust if needed logic
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

def get_client(account_id, key, secret):
    return boto3.client(
        's3',
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=key,
        aws_secret_access_key=secret,
        region_name="auto",
        config=Config(s3={"addressing_style": "virtual"})
    )

client_v1 = get_client(R2_V1_ID, R2_V1_KEY, R2_V1_SECRET)
client_v3 = get_client(R2_V3_ID, R2_V3_KEY, R2_V3_SECRET)

TARGET_SIZE_BYTES = 9.5 * 1024 * 1024 * 1024 # 9.5 GB

def get_v1_usage():
    total = 0
    objects = []
    paginator = client_v1.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=R2_V1_BUCKET):
        if 'Contents' in page:
            for obj in page['Contents']:
                total += obj['Size']
                objects.append(obj)
    return total, objects

def run_rebalance():
    print("Checking V1 usage...")
    current_size, objects = get_v1_usage()
    print(f"Current V1 Size: {current_size / (1024**3):.2f} GB")
    
    if current_size <= TARGET_SIZE_BYTES:
        print("Usage is safely below limit. No action needed.")
        return

    bytes_to_freed = current_size - TARGET_SIZE_BYTES
    print(f"Need to free approx: {bytes_to_freed / (1024**3):.2f} GB")

    # Sort objects by size desc (move big files first) to be efficient
    # Filter for audio_masters as they are safest to move and largest
    wavs = [o for o in objects if 'audio/' in o['Key'] or o['Key'].endswith('.wav')]
    wavs.sort(key=lambda x: x['Size'], reverse=True)

    freed = 0
    for obj in wavs:
        if freed >= bytes_to_freed:
            print("Target size reached!")
            break

        key = obj['Key']
        size = obj['Size']
        
        print(f"Moving {key} ({size/1024/1024:.2f} MB)...")

        try:
            # 1. Download
            resp = client_v1.get_object(Bucket=R2_V1_BUCKET, Key=key)
            data = resp['Body'].read()

            # 2. Upload to V3
            client_v3.put_object(
                Bucket=R2_V3_BUCKET,
                Key=key,
                Body=data,
                ContentType=resp.get('ContentType', 'audio/wav')
            )

            # 3. Update DB
            # Current URL pattern: https://pub-xxx.../key
            old_url_part = f"{R2_V1_DOMAIN}/{key}"
            # Find track
            # Try exact match or match by ending? Ideally exact.
            # But the DB might have relative or full. 
            # Let's search by ilike in DB
            
            # Note: DB stores URLs.
            track = db.query(Track).filter(Track.master_audio_url.ilike(f"%{key}")).first()
            if track:
                new_url = f"{R2_V3_DOMAIN}/{key}"
                track.master_audio_url = new_url
                db.commit()
                # print(f"Updated DB for track {track.id}")
            else:
                print(f"⚠️ Warning: Track not found in DB for key {key}. Moving anyway to save space.")

            # 4. Delete from V1
            client_v1.delete_object(Bucket=R2_V1_BUCKET, Key=key)
            
            freed += size
            print(f"✅ Moved. Freed: {freed/1024/1024:.2f} MB total.")
            
        except Exception as e:
            print(f"❌ Error moving {key}: {e}")
            db.rollback()

    print("Rebalance complete.")
    final_size, _ = get_v1_usage()
    print(f"Final V1 Size: {final_size / (1024**3):.2f} GB")

if __name__ == "__main__":
    run_rebalance()
