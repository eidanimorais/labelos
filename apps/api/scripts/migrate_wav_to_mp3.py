
import os
import sys
import boto3
from botocore.config import Config
import subprocess
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.models import Track
from backend.database import Base

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

# DB Config
DATABASE_URL = "sqlite:////Users/daniel/Documents/DEV/royalties/royalties.db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# R2 Configs
def get_r2_config(prefix):
    return {
        'id': os.getenv(f"R2_{prefix}_ACCOUNT_ID"),
        'key': os.getenv(f"R2_{prefix}_ACCESS_KEY_ID"),
        'secret': os.getenv(f"R2_{prefix}_SECRET_ACCESS_KEY"),
        'bucket': os.getenv(f"R2_{prefix}_BUCKET_NAME"),
        'domain': os.getenv(f"R2_{prefix}_PUBLIC_DOMAIN")
    }

def get_client(config):
    if not all([config['id'], config['key'], config['secret']]):
        return None
    return boto3.client(
        's3',
        endpoint_url=f"https://{config['id']}.r2.cloudflarestorage.com",
        aws_access_key_id=config['key'],
        aws_secret_access_key=config['secret'],
        region_name="auto",
        config=Config(s3={"addressing_style": "virtual"})
    )

configs = {f"V{i}": get_r2_config(f"V{i}") for i in range(1, 6)}
clients = {v: get_client(c) for v, c in configs.items() if c['id']}

V5_CONFIG = configs['V5']
client_v5 = clients['V5']

def convert_to_mp3(input_path, output_path):
    cmd = [
        'ffmpeg', '-y', '-i', input_path,
        '-codec:a', 'libmp3lame', '-qscale:a', '2',
        output_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def run_migration():
    print("🚀 Starting WAV to MP3 migration to label-os-5 (V5)...")
    
    # Find all tracks with WAV Master Audio
    tracks = db.query(Track).filter(Track.master_audio_url.ilike("%.wav")).all()
    print(f"Found {len(tracks)} tracks with WAV masters.")

    for track in tracks:
        old_url = track.master_audio_url
        print(f"Processing track {track.id}: {track.title} ({old_url})")
        
        # Identify which version it is currently in
        source_v = None
        source_key = None
        
        for v, config in configs.items():
            if v == "V5": continue
            if config['domain'] and config['domain'] in old_url:
                source_v = v
                source_key = old_url.split(config['domain'] + "/")[-1]
                break
        
        if not source_v or not source_key:
            # Fallback if domain is not set properly, try searching in buckets
            # (Simplified for now, assuming domains are correct)
            print(f"  ⚠️ Could not identify source bucket for {old_url}")
            continue

        source_client = clients.get(source_v)
        if not source_client:
            print(f"  ❌ Client for {source_v} not available.")
            continue

        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                wav_path = os.path.join(tmpdir, "input.wav")
                mp3_path = os.path.join(tmpdir, "output.mp3")
                
                # 1. Download
                print(f"  📥 Downloading from {source_v}...")
                source_client.download_file(configs[source_v]['bucket'], source_key, wav_path)
                
                # 2. Convert
                print(f"  🔄 Converting to MP3...")
                convert_to_mp3(wav_path, mp3_path)
                
                # 3. Upload to V5
                mp3_key = source_key.replace(".wav", ".mp3").replace(".WAV", ".mp3")
                if not mp3_key.endswith(".mp3"):
                    mp3_key += ".mp3"
                
                print(f"  📤 Uploading to V5 (label-os-5)...")
                client_v5.upload_file(mp3_path, V5_CONFIG['bucket'], mp3_key, ExtraArgs={'ContentType': 'audio/mpeg'})
                
                # 4. Update DB
                new_url = f"{V5_CONFIG['domain']}/{mp3_key}"
                track.master_audio_url = new_url
                db.commit()
                print(f"  ✅ Success! New URL: {new_url}")
                
                # 5. Optional: Delete old WAV?
                # User requested to KEEP original WAV files.
                # print(f"  🗑️ Deleting old WAV from {source_v}...")
                # source_client.delete_object(Bucket=configs[source_v]['bucket'], Key=source_key)
                print(f"  ✨ Kept original WAV in {source_v}.")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
            db.rollback()

    print("🏁 Migration complete.")

if __name__ == "__main__":
    if not client_v5:
        print("❌ Error: V5 configuration is missing or invalid.")
        sys.exit(1)
    run_migration()
