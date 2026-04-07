import sys
import os
import pandas as pd
from datetime import datetime

# Add project root to sys.path
sys.path.append(os.getcwd())

from apps.api.database import SessionLocal
from apps.api import models

def export_splits():
    db = SessionLocal()
    try:
        print("Fetching splits...")
        
        # Join Split, Track, and Profile to get human-readable names
        query = db.query(
            models.Split.id,
            models.Track.isrc,
            models.Track.title.label("track_title"),
            models.Split.role,
            models.Split.percentage,
            models.Profile.name.label("profile_name"),
            models.Split.participant_name.label("fallback_name")
        ).join(models.Track, models.Split.track_id == models.Track.id)\
         .outerjoin(models.Profile, models.Split.profile_id == models.Profile.id)
        
        splits = query.all()
        
        if not splits:
            print("No split data found.")
            return

        # Prepare list of dicts
        data = []
        for s in splits:
            # Use profile name if linked, else fallback
            final_name = s.profile_name if s.profile_name else s.fallback_name
            
            data.append({
                "ISRC": s.isrc,
                "Faixa": s.track_title,
                "Nome": final_name,
                "Função": s.role,
                "Porcentagem (%)": s.percentage
            })
            
        df = pd.DataFrame(data)
        
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"splits_export_{timestamp}.csv"
        output_path = os.path.join(os.getcwd(), filename)
        
        df.to_csv(output_path, index=False, encoding='utf-8-sig')
        print(f"✅ Exported {len(data)} splits to: {output_path}")
        
    except Exception as e:
        print(f"❌ Error exporting splits: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    export_splits()
