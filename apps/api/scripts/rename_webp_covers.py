import os
import sys
import shutil
from sqlalchemy.orm import Session
import unicodedata
import re

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal
from backend import models

IMAGES_DIR = os.path.join(project_root, "frontend/public/images/capa")

def slugify(text):
    if not text: return ""
    text = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text).lower().strip()
    text = re.sub(r'[-\s]+', '-', text)
    return text

def rename_webp_covers():
    db = SessionLocal()
    try:
        tracks = db.query(models.Track).all()
        print(f"Verificando {len(tracks)} faixas no banco de dados...")
        
        renamed_count = 0
        already_correct = 0
        missing = 0
        
        for track in tracks:
            # Get Artist Name
            artist_name = "Unknown"
            if track.artist:
                artist_name = track.artist.name
            
            if artist_name == "Unknown":
                # Skip unknown artists for now or handle them? 
                # If artist is unknown, filename should be just song.webp per getCoverUrl logic check?
                # No, getCoverUrl defaults to song.webp if artist is unknown. 
                # So we leave them as is.
                continue

            track_slug = slugify(track.title)
            artist_slug = slugify(artist_name)
            
            target_filename = f"{artist_slug}-{track_slug}.webp"
            legacy_filename = f"{track_slug}.webp"
            
            target_path = os.path.join(IMAGES_DIR, target_filename)
            legacy_path = os.path.join(IMAGES_DIR, legacy_filename)
            
            if os.path.exists(target_path):
                already_correct += 1
                continue
            
            if os.path.exists(legacy_path):
                print(f"Renomeando: {legacy_filename} -> {target_filename}")
                shutil.move(legacy_path, target_path)
                renamed_count += 1
            else:
                missing += 1
                # print(f"Missing: {target_filename} (and legacy {legacy_filename})")

        print("\n--- Resumo ---")
        print(f"Já estavam corretos: {already_correct}")
        print(f"Renomeados agora: {renamed_count}")
        print(f"Não encontrados (talvez sem capa): {missing}")

    finally:
        db.close()

if __name__ == "__main__":
    rename_webp_covers()
