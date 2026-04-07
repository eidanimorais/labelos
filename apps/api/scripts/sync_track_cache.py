import os
import sys
from sqlalchemy import func

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from backend.database import SessionLocal
from backend import models

def sync_track_cache():
    db = SessionLocal()
    try:
        print("🕒 Iniciando sincronização de cache das tracks...")
        
        # Aggregate all transactions for all tracks
        # This is more efficient than track by track
        stats_subquery = db.query(
            models.Transaction.track_id,
            func.sum(models.Transaction.streams).label("total_streams"),
            func.sum(models.Transaction.royalties_value).label("total_revenue")
        ).group_by(models.Transaction.track_id).all()
        
        print(f"📊 Processando dados de {len(stats_subquery)} tracks com transações...")
        
        updated_count = 0
        for track_id, streams, revenue in stats_subquery:
            if track_id:
                db.query(models.Track).filter(models.Track.id == track_id).update({
                    "cached_streams": streams or 0,
                    "cached_revenue": revenue or 0.0
                })
                updated_count += 1
                
                # Print progress every 100 tracks
                if updated_count % 100 == 0:
                    print(f"✅ {updated_count} tracks atualizadas...")
        
        db.commit()
        print(f"\n✨ Sincronização concluída! {updated_count} tracks atualizadas com sucesso.")

    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao sincronizar cache: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_track_cache()
