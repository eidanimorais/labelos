import sys
import os
import shutil
import unicodedata
import re

# Adicionar o diretório raiz do projeto ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

COVERS_DIR = os.path.join(project_root, "frontend/public/images/capa/capa_full")

def slugify(value):
    if not value: return ""
    value = str(value)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value).lower().strip()
    return re.sub(r'[-\s]+', '-', value)

def apply_manual_corrections():
    db = SessionLocal()
    try:
        # Mapeamento fornecido pelo usuário: NomeArquivoAtual -> NomeMusica (ou Artista se for o caso)
        # Ajustei para buscar a música e gerar o slug correto
        corrections = {
            "carti - capa.png": {"type": "artist_check", "artist": "Akashi Cruz", "title": "Carti"},
            "succubus.jpg": {"type": "artist_check", "artist": "Akashi Cruz", "title": "Succubus"},
            "Mahō 2 .jpeg": {"type": "manual", "target": "akashi-cruz-maho-2.jpeg"}, # Assumindo padrão
            "Times Square (Slowed).jpeg": {"type": "manual", "target": "akashi-cruz-times-square-slowed.jpeg"},
            "EUTOVIAJANDO.jpeg": {"type": "db_search", "title": "Eu tô viajando"}, # Pesquisar Artista
            "AKASHI_CRUZ_MUITO_OBRIGADO_POR_NADA_v2.png": {"type": "db_search", "title": "Muito obrigado por nada"}
        }

        print(f"Processando {len(corrections)} correções manuais...")
        
        for filename, rule in corrections.items():
            file_path = os.path.join(COVERS_DIR, filename)
            if not os.path.exists(file_path):
                print(f"⚠️  Arquivo não encontrado: {filename}")
                continue

            name_part, ext = os.path.splitext(filename)
            new_filename = None

            if rule['type'] == 'manual':
                new_filename = rule['target']
            
            elif rule['type'] == 'artist_check':
                # Busca track com esse titulo e artista
                # Mas como já sabemos o outcome desejado (akashi-cruz-titulo), podemos montar o slug direto
                # Para garantir, vou montar o slug:
                new_filename = f"{slugify(rule['artist'])}-{slugify(rule['title'])}{ext}"
            
            elif rule['type'] == 'db_search':
                # Buscar track pelo título no banco
                # Usar like/ilike
                track = db.query(models.Track).filter(models.Track.title.ilike(rule['title'])).first()
                if track:
                    artist_name = track.artist.name if track.artist else "Unknown"
                    new_filename = f"{slugify(artist_name)}-{slugify(track.title)}{ext}"
                    print(f"🔍 Encontrado no banco: {rule['title']} -> {artist_name}")
                else:
                    print(f"❌ Música não encontrada no banco: {rule['title']}")
                    continue

            if new_filename:
                # Renomear
                new_path = os.path.join(COVERS_DIR, new_filename)
                if file_path != new_path:
                    shutil.move(file_path, new_path)
                    print(f"✅ Corrigido: '{filename}' -> '{new_filename}'")
                else:
                    print(f"ℹ️  Já estava correto: {filename}")

    except Exception as e:
        print(f"Erro: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    apply_manual_corrections()
