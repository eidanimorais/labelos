
import sys
import os
import csv
from datetime import datetime

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track

def import_dates():
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads', 'fuub-data-de-lancamento.csv')
    
    if not os.path.exists(csv_path):
        print(f"Arquivo não encontrado: {csv_path}")
        return

    db = SessionLocal()
    updated_count = 0
    not_found = []
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            # Normalize header names just in case
            # The file has: música,data de lançamento
            
            for row in reader:
                title_raw = row.get('música', '').strip()
                date_raw = row.get('data de lançamento', '').strip()
                
                if not title_raw or not date_raw:
                    continue
                
                # Parse date DD/MM/YYYY -> YYYY-MM-DD
                try:
                    dt = datetime.strptime(date_raw, '%d/%m/%Y')
                    formatted_date = dt.strftime('%Y-%m-%d')
                except ValueError:
                    print(f"Data inválida para '{title_raw}': {date_raw}")
                    continue
                    
                # Find tracks by title (case-insensitive)
                # Using ilike for case-insensitive search in SQL
                tracks = db.query(Track).filter(Track.title.ilike(title_raw)).all()
                
                if not tracks:
                    # Try looking for exact match in 'musica_display' if title differs (though model uses title)
                    not_found.append(title_raw)
                    continue
                
                for track in tracks:
                    # Update release date if it's currently empty or overwrite? 
                    # User said "preencha", implies overwrite or fill. "adicionar" usually means fill.
                    # But often bulk imports are strictly authoritative. I will overwrite.
                    track.release_date = formatted_date
                    updated_count += 1
            
            db.commit()
            print(f"Processo concluído.")
            print(f"Faixas atualizadas: {updated_count}")
            if not_found:
                print(f"Músicas não encontradas no banco ({len(not_found)}):")
                for t in not_found[:10]: # Check first 10
                    print(f" - {t}")
                if len(not_found) > 10:
                    print(f" ... e mais {len(not_found) - 10}")

    except Exception as e:
        print(f"Erro durante a importação: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_dates()
