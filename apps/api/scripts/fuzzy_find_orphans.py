import sys
import os
import unicodedata
import re

# Adicionar o diretório raiz do projeto ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal
from backend import models

def slugify(text):
    if not text: return ""
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text).lower().strip()
    return re.sub(r'[-\s]+', '-', text)

ORPHANS = [
    "akashi-cruz-garota-de-status", "aquele-dia-no-parque", "mais-um-dia-chuvoso", "amar-quase-me-matou", 
    "quero-te-dizer-adeus", "akashi-cruz-collab", "lembra-daquele-dia", 
    "akashi-cruz-conta-essa-historia-direito-fantasma-remix", "akashi-cruz-shaquille-o-neal", 
    "voce-so-quer-biscoitar", "amar-e-mo-bom", "sou-podre-de-espirito", "o-ultimo-romantico", 
    "vida-de-um-trabalhador", "eu-cansei-de-sofrer", "preciso-mudar-minha-vida", "voce-tem-muito-ego", 
    "inicio-da-minha-solidao", "akashi-cruz-quem-e-voce", "akashi-cruz-pizza", "flow-natalino-3", 
    "se-arrependeu-de-vacilar-comigo", "nao-precisa-pedir-perdao", "te-bloqueei-de-tudo", 
    "lembrancas-daquele-verao", "voce-merece-alguem-melhor", "365-dias", "voce-me-iludiu", 
    "me-lembro-de-voce", "me-chamar-de-vida", "low-profile", "+1", "eu-nao-levo-incertezas", 
    "mais-foco-menos-ansiedade", "eu-nao-tenho-jeito", "voce-quebrou-meu-coracao", "oi-me-nome-e", 
    "quando-voce-me-deixou", "ah-vida-e-foda", "nao-sei-se-eu-vou", "akashi-cruz-brilho-muito"
]

def fuzzy_find_orphans():
    db = SessionLocal()
    all_tracks = db.query(models.Track).all()
    
    results = []
    
    for orphan in ORPHANS:
        orphan_clean = orphan.replace("akashi-cruz-", "").replace("snif-", "").replace("lil-chainz-", "").replace("-", " ")
        found = False
        for t in all_tracks:
            t_title = t.title.lower()
            # If orphan name is in track title or vice versa
            if orphan_clean in t_title or t_title in orphan_clean:
                artist = t.artist.name if t.artist else "Unknown"
                results.append(f"Match: File '{orphan}' -> DB Track '{t.title}' ({artist})")
                found = True
        if not found:
             results.append(f"X No Match: File '{orphan}'")
             
    for r in results:
        print(r)
    db.close()

if __name__ == "__main__":
    fuzzy_find_orphans()
