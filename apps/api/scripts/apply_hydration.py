
import sys
import os
import json

# Add root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models import Track

def apply_hydration():
    results_path = os.path.join(os.path.dirname(__file__), 'hydration_results.json')
    
    if not os.path.exists(results_path):
        print(f"Results file not found: {results_path}")
        return

    with open(results_path, 'r') as f:
        updates = json.load(f)

    db = SessionLocal()
    try:
        count = 0
        for item in updates:
            if not item: continue
            
            isrc = item['isrc']
            track = db.query(Track).filter(Track.isrc == isrc).first()
            
            if track:
                changed = False
                if item.get('cover_url'):
                    track.cover_url = item['cover_url']
                    changed = True
                if item.get('master_audio_url'):
                    track.master_audio_url = item['master_audio_url']
                    changed = True
                
                if changed:
                    count += 1
                    # print(f"Updated {isrc}")
        
        db.commit()
        print(f"Applied updates to {count} tracks.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    apply_hydration()
