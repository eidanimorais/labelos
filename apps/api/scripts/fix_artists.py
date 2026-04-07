import sys
import os

# Adicionar o diretório raiz do projeto ao path
# Assume que este script está em backend/scripts/fix_artists.py
# Então o root é ../../
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models
import re

def clean_artist_name(raw_name):
    if not raw_name:
        return "Unknown"
    
    # Regra 1: Remover tudo após a primeira vírgula (pegar apenas o primeiro artista principal)
    name = raw_name.split(',')[0]
    
    # Regra 2: Remover tudo a partir de parenteses (ex: "Gaki (performer)" -> "Gaki")
    name = name.split('(')[0]
    
    return name.strip()

def fix_artists():
    db = SessionLocal()
    try:
        tracks = db.query(models.Track).all()
        print(f"Processando {len(tracks)} faixas...")
        
        updated_count = 0
        created_profiles = 0
        
        for track in tracks:
            # Se já tem artista, pula (ou podemos forçar update se quiser garantir a regra nova)
            # Vamos forçar update se o atual for None ou se quiser validar todos
            
            # Buscar raw_artist de alguma transação
            transaction = db.query(models.Transaction).filter(models.Transaction.track_id == track.id).first()
            
            if not transaction or not transaction.raw_artist:
                print(f"⚠️ Faixa sem transação ou raw_artist: {track.title} ({track.isrc})")
                continue
                
            clean_name = clean_artist_name(transaction.raw_artist)
            
            if not clean_name or clean_name == "Unknown":
                continue
                
            # Verificar se Profile já existe
            profile = db.query(models.Profile).filter(models.Profile.name == clean_name).first()
            
            if not profile:
                print(f"✨ Criando novo perfil: {clean_name}")
                profile = models.Profile(name=clean_name, type="artist")
                db.add(profile)
                db.commit() # Commit logo para ter o ID
                db.refresh(profile)
                created_profiles += 1
            
            # Atualizar Track
            if track.artist_id != profile.id:
                track.artist_id = profile.id
                updated_count += 1
                # print(f"✅ Atualizado: {track.title} -> {clean_name}")
        
        db.commit()
        print("\n--- Relatório Final ---")
        print(f"Total Faixas: {len(tracks)}")
        print(f"Perfis Criados: {created_profiles}")
        print(f"Faixas Associadas/Corrigidas: {updated_count}")
        
    except Exception as e:
        print(f"Erro crítico: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_artists()
