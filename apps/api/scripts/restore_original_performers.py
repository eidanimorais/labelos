
import sys
import os

# Adicionar o diretório raiz do projeto ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

def clean_artist_name(raw_name):
    if not raw_name:
        return None
    # Regra: pegar apenas o primeiro artista principal (antes da vírgula)
    name = raw_name.split(',')[0]
    # Remover (performer), (original), etc
    name = name.split('(')[0]
    return name.strip()

def restore_original_performers():
    db = SessionLocal()
    try:
        tracks = db.query(models.Track).all()
        print(f"Analisando {len(tracks)} tracks para restauração de intérpretes...")
        
        updated_count = 0
        profiles_created = 0
        
        for track in tracks:
            # Buscar a transação mais representativa (ou qualquer uma com raw_artist)
            transaction = db.query(models.Transaction).filter(
                models.Transaction.track_id == track.id,
                models.Transaction.raw_artist != None,
                models.Transaction.raw_artist != ""
            ).first()
            
            if not transaction:
                continue
                
            clean_name = clean_artist_name(transaction.raw_artist)
            if not clean_name:
                continue
                
            # Buscar ou criar Perfil
            profile = db.query(models.Profile).filter(models.Profile.name == clean_name).first()
            if not profile:
                print(f"✨ Criando perfil para intérprete: {clean_name}")
                profile = models.Profile(name=clean_name, type="artist")
                db.add(profile)
                db.commit()
                db.refresh(profile)
                profiles_created += 1
            
            # Verificar se o artist_id atual é diferente do intérprete
            if track.artist_id != profile.id:
                old_artist = track.artist.name if track.artist else "None"
                track.artist_id = profile.id
                updated_count += 1
                if track.isrc == 'BC2GV2300060':
                    print(f"🎯 Corrigido: '{track.title}' ({track.isrc}) - De: {old_artist} -> Para: {clean_name}")
        
        db.commit()
        print("\n--- Relatório de Restauração ---")
        print(f"Tracks processadas: {len(tracks)}")
        print(f"Perfis criados: {profiles_created}")
        print(f"Tracks restauradas para intérprete original: {updated_count}")
        
    except Exception as e:
        print(f"Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    restore_original_performers()
