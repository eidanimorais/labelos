import os
import sys
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal, engine

def reset_database():
    print("⚠️  ATENÇÃO: INICIANDO RESET DO SISTEMA ⚠️")
    print("Isso apagará TODOS os dados importados (Tracks, Transactions, Artists, etc).")
    
    # Tables to clear in order (respecting foreign keys)
    tables_to_clear = [
        "transactions",
        "splits",
        "technical_credits",
        "contracts",
        "tracks",
        "works",
        "profiles",
        "imports"
    ]
    
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            for table in tables_to_clear:
                print(f"Limpando tabela: {table}...")
                connection.execute(text(f"DELETE FROM {table}"))
                # Reset sequence (optional for SQLite, but good practice if using Postgres later or for cleanliness)
                # For SQLite: DELETE FROM sqlite_sequence WHERE name='table_name';
                if 'sqlite' in str(engine.url):
                    try:
                        connection.execute(text(f"DELETE FROM sqlite_sequence WHERE name='{table}'"))
                    except Exception:
                        pass # Ignore errors if sqlite_sequence doesn't exist or other issues
            
            trans.commit()
            print("\n✅ Reset concluído com sucesso! O sistema está zerado.")
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ Erro ao resetar banco de dados: {e}")

if __name__ == "__main__":
    reset_database()
