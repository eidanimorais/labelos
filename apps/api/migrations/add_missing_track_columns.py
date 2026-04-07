
import sqlite3
import os

# Caminho para o banco de dados
# O script está em backend/migrations/script.py
# backend/migrations -> backend -> royalties (root) -> database -> royalties.db
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(ROOT_DIR, 'database', 'royalties.db')

def add_columns():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Lista de colunas que parecem estar faltando baseadas no erro e no padrão do modelo
    # O erro específico foi 'mixing_engineer'.
    # Vou adicionar outras que provavelmente foram adicionadas junto.
    columns_to_add = [
        ("producer", "VARCHAR"),
        ("audio_engineer", "VARCHAR"),
        ("mixing_engineer", "VARCHAR"),
        ("mastering_engineer", "VARCHAR"),
        ("release_time_platforms", "VARCHAR"),
        ("release_time_youtube", "VARCHAR"),
        ("isrc_video", "VARCHAR"),
        ("explicit", "VARCHAR DEFAULT 'Não'"),
        ("author_contact", "VARCHAR"),
        ("album", "VARCHAR"),
        ("track_number", "INTEGER"),
        ("format", "VARCHAR"),
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE tracks ADD COLUMN {col_name} {col_type}")
            print(f"Column {col_name} added successfully.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()

if __name__ == "__main__":
    if os.path.exists(DB_PATH):
        print(f"Database found at {DB_PATH}")
        add_columns()
    else:
        print(f"Database not found at {DB_PATH}")
