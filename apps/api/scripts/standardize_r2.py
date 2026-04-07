
import os
import sys
import boto3
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

# R2 Config
def get_client(prefix):
    account_id = os.getenv(f"R2_{prefix}_ACCOUNT_ID")
    key = os.getenv(f"R2_{prefix}_ACCESS_KEY_ID")
    secret = os.getenv(f"R2_{prefix}_SECRET_ACCESS_KEY")
    bucket = os.getenv(f"R2_{prefix}_BUCKET_NAME")
    domain = os.getenv(f"R2_{prefix}_PUBLIC_DOMAIN")
    
    if not all([account_id, key, secret, bucket]):
        return None, None, None

    client = boto3.client(
        's3',
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=key,
        aws_secret_access_key=secret,
        region_name="auto",
        config=Config(s3={"addressing_style": "virtual"})
    )
    return client, bucket, domain

def standardize_bucket(version):
    client, bucket, domain = get_client(version)
    if not client:
        print(f"Skipping {version} (not configured)")
        return

    print(f"Standardizing {version} ({bucket})...")
    
    # List all objects
    paginator = client.get_paginator('list_objects_v2')
    
    for page in paginator.paginate(Bucket=bucket):
        if 'Contents' not in page:
            continue
            
        for obj in page['Contents']:
            old_key = obj['Key']
            new_key = None
            
            # Determine new key
            if old_key.startswith('audio_masters/'):
                new_key = old_key.replace('audio_masters/', 'audio/', 1)
            elif old_key.startswith('cover_masters/'):
                new_key = old_key.replace('cover_masters/', 'cover/', 1)
            elif old_key.startswith('covers/'):
                new_key = old_key.replace('covers/', 'cover/', 1)
            
            if new_key and new_key != old_key:
                print(f"Migrating: {old_key} -> {new_key}")
                
                try:
                    # 1. Copy to new location
                    client.copy_object(
                        Bucket=bucket,
                        CopySource={'Bucket': bucket, 'Key': old_key},
                        Key=new_key
                    )
                    
                    # 2. Update DB
                    # We look for the OLD url pattern in the DB
                    # The DB could have full URL or relative path
                    # We'll search for both partial matches
                    
                    # Pattern 1: Absolute URL
                    old_url_abs = f"{domain}/{old_key}"
                    new_url_abs = f"{domain}/{new_key}"
                    
                    # Pattern 2: Relative URL (just in case)
                    old_url_rel = f"/{old_key}"
                    new_url_rel = f"/{new_key}"
                    
                    # Update Track Master Audio
                    tracks_audio = db.query(Track).filter(Track.master_audio_url.like(f"%{old_key}")).all()
                    for t in tracks_audio:
                        if t.master_audio_url and old_key in t.master_audio_url:
                            t.master_audio_url = t.master_audio_url.replace(old_key, new_key)
                            # Also fix folder name if it was part of replacement, usually implied
                            
                    # Update Track Cover
                    tracks_cover = db.query(Track).filter(Track.cover_url.like(f"%{old_key}")).all()
                    for t in tracks_cover:
                         if t.cover_url and old_key in t.cover_url:
                            t.cover_url = t.cover_url.replace(old_key, new_key)
                            
                    db.commit()
                    
                    # 3. Delete old object
                    client.delete_object(Bucket=bucket, Key=old_key)
                    print(f"✅ Migrated {old_key}")

                except Exception as e:
                    print(f"❌ Error migrating {old_key}: {e}")
                    db.rollback()

if __name__ == "__main__":
    standardize_bucket("V1")
    standardize_bucket("V2")
    standardize_bucket("V3")
