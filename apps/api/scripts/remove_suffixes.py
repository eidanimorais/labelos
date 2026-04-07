
import os
import sys
import boto3
from botocore.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend headers
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.models import Track

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

def rename_in_bucket(version):
    client, bucket, domain = get_client(version)
    if not client:
        print(f"Skipping {version} (not configured)")
        return

    print(f"Renaming files in {version} ({bucket})...")
    
    paginator = client.get_paginator('list_objects_v2')
    
    count = 0
    for page in paginator.paginate(Bucket=bucket):
        if 'Contents' not in page:
            continue
            
        for obj in page['Contents']:
            old_key = obj['Key']
            new_key = None
            
            # Logic: Remove _master from audio and _cover from cover
            # audio/ISRC_master.wav -> audio/ISRC.wav
            # cover/ISRC_cover.jpg -> cover/ISRC.jpg
            
            if old_key.startswith('audio/') and '_master.' in old_key:
                new_key = old_key.replace('_master.', '.')
            elif old_key.startswith('cover/') and '_cover.' in old_key:
                # Be careful not to replace 'cover/' folder part
                # split folder and filename
                parts = old_key.split('/')
                filename = parts[1]
                if '_cover.' in filename:
                    new_filename = filename.replace('_cover.', '.')
                    new_key = f"{parts[0]}/{new_filename}"
            
            if new_key and new_key != old_key:
                print(f"Renaming: {old_key} -> {new_key}")
                
                try:
                    # 1. Copy to new name
                    client.copy_object(
                        Bucket=bucket,
                        CopySource={'Bucket': bucket, 'Key': old_key},
                        Key=new_key
                    )
                    
                    # 2. Update DB
                    # Update Track Master Audio
                    if new_key.startswith('audio/'):
                        tracks = db.query(Track).filter(Track.master_audio_url.like(f"%{old_key}")).all()
                        for t in tracks:
                            if t.master_audio_url:
                                t.master_audio_url = t.master_audio_url.replace(old_key, new_key)
                        db.commit()

                    # Update Track Cover
                    if new_key.startswith('cover/'):
                        tracks = db.query(Track).filter(Track.cover_url.like(f"%{old_key}")).all()
                        for t in tracks:
                            if t.cover_url:
                                t.cover_url = t.cover_url.replace(old_key, new_key)
                        db.commit()
                    
                    # 3. Delete old object
                    client.delete_object(Bucket=bucket, Key=old_key)
                    count += 1
                    # print(f"✅ Renamed {old_key}")

                except Exception as e:
                    print(f"❌ Error renaming {old_key}: {e}")
                    db.rollback()

    print(f"Finished {version}. Renamed {count} files.")

if __name__ == "__main__":
    rename_in_bucket("V1")
    rename_in_bucket("V2")
    rename_in_bucket("V3")
