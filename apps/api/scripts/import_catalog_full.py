
import sys
import os
import csv
from datetime import datetime

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track, Profile

def clean_isrc(isrc_raw):
    # Handle "ISRC1, ISRC2" -> take the one starting with BC2GV if possible, or first.
    if not isrc_raw:
        return None
    parts = [p.strip() for p in isrc_raw.split(',')]
    for p in parts:
        if p.startswith('BC2GV'):
            return p
    return parts[0]

def import_full_catalog():
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads', 'catalogo-completo-fuub.csv')
    
    if not os.path.exists(csv_path):
        print(f"Arquivo não encontrado: {csv_path}")
        return

    db = SessionLocal()
    
    try:
        updated_count = 0
        created_count = 0
        
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Mapping
                title = row.get('SONG NAME', '').strip()
                isrc_raw = row.get('ISRC', '').strip()
                artist_raw = row.get('PRIMARY ARTISTS', '').strip()
                composer = row.get('COMPOSITORES', '').strip()
                genre = row.get('RELEASE GENRE', '').strip()
                date_raw = row.get('RELEASE DATE', '').strip()
                cover_url = row.get('COVER ART', '').strip()
                audio_url = row.get('WAV', '').strip()
                
                # New fields
                album = row.get('RELEASE NAME', '').strip()
                track_num_raw = row.get('TRACK', '').strip()
                format_type = row.get('FORMAT', '').strip()
                duration = row.get('TRACK LENGHT', '').strip() # Note typo in CSV header
                producer = row.get('PRODUCER', '').strip()
                
                if not title:
                    continue
                    
                isrc = clean_isrc(isrc_raw)
                
                # Parse Date
                release_date = None
                if date_raw:
                    try:
                        release_date = datetime.strptime(date_raw, '%d/%m/%Y').strftime('%Y-%m-%d')
                    except:
                        pass
                
                # Parse Track Number
                track_number = None
                if track_num_raw:
                    try:
                        track_number = int(track_num_raw)
                    except:
                        pass

                # Strategy: Try Find by ISRC, then Title
                track = None
                if isrc:
                    track = db.query(Track).filter(Track.isrc == isrc).first()
                if not track:
                    track = db.query(Track).filter(Track.title.ilike(title)).first()
                    if track and isrc and not track.isrc:
                        track.isrc = isrc
                
                fields_to_update = {
                    'artist_name': artist_raw,
                    'composer': composer,
                    'genre': genre,
                    'release_date': release_date,
                    'cover_url': cover_url,
                    'master_audio_url': audio_url,
                    'album': album,
                    'track_number': track_number,
                    'format': format_type,
                    'duration': duration,
                    'producer': producer
                }

                if not track:
                    if isrc:
                        track = Track(
                            isrc=isrc,
                            title=title,
                            **{k: v for k, v in fields_to_update.items() if v is not None}
                        )
                        db.add(track)
                        created_count += 1
                    else:
                        print(f"Skipping creation for '{title}' (No ISRC)")
                        continue
                else:
                    # Update fields if provided
                    for k, v in fields_to_update.items():
                        if v:
                            setattr(track, k, v)
                    
                    if isrc and not track.isrc:
                         track.isrc = isrc
                         
                    updated_count += 1

        db.commit()
        print("Importação concluída.")
        print(f"Novas faixas criadas: {created_count}")
        print(f"Faixas existentes atualizadas: {updated_count}")
        print("Campos extras (Album, Format, Track#, Producer, Duration) preenchidos.")

    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_full_catalog()
