
import sys
import os
import csv
import glob
from datetime import datetime

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track

def normalize_key(k):
    return str(k).lower().strip()

def get_col(row, valid_cols):
    for k in row.keys():
        if normalize_key(k) in valid_cols:
            return row[k]
    return None

def import_batch():
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    uploads_dir = os.path.join(root_dir, 'uploads')
    
    # Pattern to match the files
    pattern = os.path.join(uploads_dir, '*-data-de-lancamento.csv')
    files = glob.glob(pattern)
    
    if not files:
        print(f"Nenhum arquivo encontrado no padrão: {pattern}")
        return

    print(f"Encontrados {len(files)} arquivos para processar.")
    
    db = SessionLocal()
    
    possible_title_cols = ['música', 'musica', 'title', 'faixa', 'track', 'nome']
    possible_date_cols = ['data de lançamento', 'data de lancamento', 'release date', 'data']

    try:
        total_updated = 0
        for csv_file in sorted(files):
            filename = os.path.basename(csv_file)
            print(f"\n--- Processando: {filename} ---")
            
            count_updated = 0
            count_not_found = 0
            not_found_list = []
            
            try:
                # Use utf-8-sig to handle BOM automatically
                with open(csv_file, 'r', encoding='utf-8-sig') as f:
                    # Detect delimiter? assume comma for now, but inspect first line
                    head = [f.readline() for _ in range(5)]
                    f.seek(0)
                    delimiter = ','
                    if head and ';' in head[0] and ',' not in head[0]:
                        delimiter = ';'
                    
                    reader = csv.DictReader(f, delimiter=delimiter)
                    
                    if not reader.fieldnames:
                        print(f"  [AVISO] Arquivo vazio ou sem cabeçalho válido.")
                        continue
                        
                    for row in reader:
                        title_raw = get_col(row, possible_title_cols)
                        date_raw = get_col(row, possible_date_cols)
                        
                        if not title_raw or not date_raw:
                            continue
                        
                        title_raw = title_raw.strip()
                        date_raw = date_raw.strip()
                        
                        if not title_raw: continue
                        
                        # Parse date
                        formatted_date = None
                        try:
                             dt = datetime.strptime(date_raw, '%d/%m/%Y')
                             formatted_date = dt.strftime('%Y-%m-%d')
                        except ValueError:
                            # Try YYYY-MM-DD
                            try:
                                dt = datetime.strptime(date_raw, '%Y-%m-%d')
                                formatted_date = dt.strftime('%Y-%m-%d')
                            except:
                                pass
                        
                        if not formatted_date:
                            # print(f"  Data inválida ignorada: {date_raw} em '{title_raw}'")
                            continue

                        # Lookup Track (Exact, case insensitive)
                        tracks = db.query(Track).filter(Track.title.ilike(title_raw)).all()
                        
                        # Fallback: remove ' (feat...' or ' (prod...'
                        if not tracks:
                            clean_title = title_raw.split('(')[0].strip()
                            if clean_title != title_raw:
                                tracks = db.query(Track).filter(Track.title.ilike(clean_title)).all()
                        
                        if not tracks:
                            count_not_found += 1
                            not_found_list.append(title_raw)
                            continue
                        
                        for t in tracks:
                            t.release_date = formatted_date
                            count_updated += 1
                
                db.commit()
                total_updated += count_updated
                print(f"  > Sucesso: {count_updated} atualizações.")
                if count_not_found > 0:
                    print(f"  > Não encontrados: {count_not_found}. Exemplos: {not_found_list[:3]}")

            except Exception as e:
                print(f"  [ERRO] Falha ao processar arquivo {filename}: {e}")
                db.rollback()
        
        print(f"\n=== Processo Finalizado ===")
        print(f"Total de atualizações em todos arquivos: {total_updated}")

    finally:
        db.close()

if __name__ == "__main__":
    import_batch()
