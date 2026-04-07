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

# Caminho das capas
COVERS_DIR = os.path.join(project_root, "frontend/public/images/capa/capa_full")

def slugify(value):
    """
    Normalizes string, converts to lowercase, removes non-alpha characters,
    and converts spaces to hyphens.
    """
    if not value: return ""
    value = str(value)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value).lower().strip()
    return re.sub(r'[-\s]+', '-', value)

def organize_covers():
    db = SessionLocal()
    try:
        if not os.path.exists(COVERS_DIR):
            print(f"Erro: Diretório não encontrado: {COVERS_DIR}")
            return

        files = [f for f in os.listdir(COVERS_DIR) if os.path.isfile(os.path.join(COVERS_DIR, f)) and not f.startswith('.')]
        print(f"Encontrados {len(files)} arquivos em {COVERS_DIR}")
        
        tracks = db.query(models.Track).all()
        # Pre-calculate slugs for all tracks
        track_slugs = []
        for t in tracks:
            artist_name = t.artist.name if t.artist else "unknown"
            t_slug = slugify(t.title)
            # Slug completo esperado apenas para comparação, mas o match será pelo título
            track_slugs.append({
                "track": t,
                "title_slug": t_slug,
                "artist_slug": slugify(artist_name),
                "full_slug": f"{slugify(artist_name)}-{t_slug}"
            })

        renamed_count = 0
        doubts = []
        
        for filename in files:
            name_part, ext = os.path.splitext(filename)
            file_slug = slugify(name_part)
            
            # Se já estiver no padrão correto (slug do artista + slug do titulo), ignorar?
            # Melhor verificar se matches com alguma track full slug
            
            # 1. Tentativa de Match Exato (Titulo contido no nome do arquivo)
            matches = []
            
            for item in track_slugs:
                # Logica heuristica:
                # Se o slug do titulo da musica for "frio-do-inverno"
                # E o arquivo for "Frio do Inverno - Final.jpg" (slug: frio-do-inverno-final)
                # O slug do titulo ESTÁ contido no slug do arquivo.
                
                # Ignorar titulos muito curtos para evitar falsos positivos (ex: "eu", "no")
                if len(item['title_slug']) < 3:
                     if item['title_slug'] == file_slug: # Apenas match exato para curtos
                         matches.append(item)
                
                elif item['title_slug'] in file_slug:
                    matches.append(item)
            
            # Filtrar matches
            unique_slugs = {m['full_slug'] for m in matches}
            
            if len(unique_slugs) == 1:
                # Success! Mesmo que tenha múltiplos matches de tracks (ex: duplicatas no banco),
                # se todas resultam no mesmo nome de arquivo, podemos prosseguir.
                match = matches[0] # Pega qualquer um, já que o slug é igual
                new_filename = f"{unique_slugs.pop()}{ext}" # slug(artist)-slug(title).ext
                
                # Se o nome já for igual, pula
                if filename == new_filename:
                    # print(f"Skipping (já correto): {filename}")
                    continue
                    
                old_path = os.path.join(COVERS_DIR, filename)
                new_path = os.path.join(COVERS_DIR, new_filename)
                
                # Renomear
                shutil.move(old_path, new_path)
                print(f"✅ Renomeado: '{filename}' -> '{new_filename}'")
                renamed_count += 1
                
            elif len(matches) == 0:
                doubts.append({"file": filename, "reason": "Nenhuma música encontrada com esse nome"})
            else:
                # Realmente ambíguo (slugs diferentes, ou seja, artistas ou titulos diferentes)
                doubts.append({"file": filename, "reason": f"Múltiplos candidatos distintos: {list(unique_slugs)}"})

        print("\n--- Resumo ---")
        print(f"Renomeados: {renamed_count}")
        print(f"Dúvidas: {len(doubts)}")
        
        if doubts:
            print("\nArquivos com dúvida (Me informe qual música pertence a cada um):")
            for d in doubts:
                print(f"- Arquivo: '{d['file']}' | Motivo: {d['reason']}")

    except Exception as e:
        print(f"Erro: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    organize_covers()
