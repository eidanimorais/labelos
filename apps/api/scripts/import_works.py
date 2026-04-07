import csv
import sqlite3
import os

def import_works():
    # Paths
    base_dir = os.path.join(os.path.dirname(__file__), '..', '..')
    db_path = os.path.join(base_dir, 'royalties.db')
    csv_path = os.path.join(base_dir, 'uploads', 'contracts', 'obras_lil_chainz.csv')
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print(f"Importing works from {csv_path} to {db_path}...")

    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader) # skip header
        
        count = 0
        for row in reader:
            if not row: continue
            
            title = row[0].strip()
            iswc = row[1].strip()
            link = row[2].strip() if len(row) > 2 else None
            
            # Cleaning "--" from ISWC
            if iswc == "--":
                iswc = None
                
            cursor.execute('''
                INSERT INTO works (title, iswc, iswc_link)
                VALUES (?, ?, ?)
            ''', (title, iswc, link))
            count += 1

    conn.commit()
    conn.close()
    print(f"Successfully imported {count} works.")

if __name__ == "__main__":
    import_works()
