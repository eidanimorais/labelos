
import sys
import os
import csv
import time

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track
from backend.services.google_drive_service import get_drive_service
from backend.services.storage_service import upload_to_r2

def hydrate_assets():
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads', 'catalogo-completo-fuub.csv')
    
    if not os.path.exists(csv_path):
        print(f"Arquivo não encontrado: {csv_path}")
        return

    db = SessionLocal()
    drive_service = get_drive_service()
    
    try:
        updated_covers = 0
        updated_wavs = 0
        
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                isrc_raw = row.get('ISRC', '').strip()
                cover_link = row.get('COVER ART', '').strip()
                wav_link = row.get('WAV', '').strip()
                
                # Helper to clean ISRC (reused logic)
                isrc = None
                if isrc_raw:
                    parts = [p.strip() for p in isrc_raw.split(',')]
                    for p in parts:
                        if p.startswith('BC2GV'):
                            isrc = p
                            break
                    if not isrc:
                        isrc = parts[0]
                
                if not isrc:
                    continue
                    
                track = db.query(Track).filter(Track.isrc == isrc).first()
                if not track:
                    print(f"Track not found in DB: {isrc}")
                    continue
                
                # Process Cover Art
                if cover_link and 'drive.google.com' in cover_link and not track.cover_url:
                    print(f"Processing Cover for {track.title} ({isrc})...")
                    file_id = drive_service.extract_id_from_url(cover_link)
                    if file_id:
                        content = drive_service.download_file(file_id)
                        if content:
                            # Assume jpg/png based on content or default to jpg
                            # Ideally we check magic numbers, but let's try to infer or default
                            filename = f"{isrc}.jpg" 
                            # Upload to R2
                            url = upload_to_r2(content, filename, "image/jpeg", folder="cover")
                            if url:
                                track.cover_url = url
                                updated_covers += 1
                                print(f"  -> Cover Updated: {url}")
                            else:
                                print("  -> R2 Upload Failed")
                        else:
                            print("  -> Drive Download Failed")
                    else:
                        print("  -> Invalid Drive Link")

                # Process WAV
                if wav_link and 'drive.google.com' in wav_link and not track.master_audio_url:
                    print(f"Processing WAV for {track.title} ({isrc})...")
                    file_id = drive_service.extract_id_from_url(wav_link)
                    if file_id:
                        content = drive_service.download_file(file_id)
                        if content:
                            filename = f"{isrc}.wav"
                            url = upload_to_r2(content, filename, "audio/wav", folder="audio")
                            if url:
                                track.master_audio_url = url
                                updated_wavs += 1
                                print(f"  -> WAV Updated: {url}")
                            else:
                                print("  -> R2 Upload Failed")
                        else:
                            print("  -> Drive Download Failed")
                    else:
                        print("  -> Invalid Drive Link")
                        
                # Commit periodically or per track to save progress
                db.commit()

        print("------------------------------------------------")
        print("Asset Hydration Completed")
        print(f"Covers Updated: {updated_covers}")
        print(f"WAVs Updated: {updated_wavs}")

    except Exception as e:
        print(f"Global Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    hydrate_assets()
