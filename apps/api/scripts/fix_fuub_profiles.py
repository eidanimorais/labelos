
import os
import sys

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.models import Profile, Track, Split
from backend.database import SessionLocal

def fix_fuub_profiles():
    db = SessionLocal()
    try:
        # 1. Identify IDs
        id_correct = 22 # Fuub
        ids_to_remove = [20, 24] # Lil Fuub, fuub
        
        print(f"Targeting Correct ID: {id_correct}")
        print(f"Removing IDs: {ids_to_remove}")

        main_profile = db.query(Profile).filter(Profile.id == id_correct).first()
        if not main_profile:
            print("Error: Main profile 'Fuub' (22) not found!")
            return

        # 2. Update Tracks
        # Move tracks from bad IDs to correct ID
        tracks = db.query(Track).filter(Track.artist_id.in_(ids_to_remove)).all()
        print(f"Found {len(tracks)} tracks associated with duplicates.")
        
        for track in tracks:
            print(f"  - Moving track '{track.title}' (ID: {track.id}) from artist {track.artist_id} to {id_correct}")
            track.artist_id = id_correct
            # Optional: Fix artist_name string if it holds the old name
            if track.artist_name in ['Lil Fuub', 'fuub']:
                track.artist_name = main_profile.name
        
        # 3. Update Splits
        splits = db.query(Split).filter(Split.profile_id.in_(ids_to_remove)).all()
        print(f"Found {len(splits)} splits associated with duplicates.")
        
        for split in splits:
             print(f"  - Moving split for track {split.track_id} from profile {split.profile_id} to {id_correct}")
             split.profile_id = id_correct
             split.participant_name = main_profile.name
        
        # 4. Delete bad profiles
        profiles_to_delete = db.query(Profile).filter(Profile.id.in_(ids_to_remove)).all()
        for p in profiles_to_delete:
            print(f"  - Deleting profile '{p.name}' (ID: {p.id})")
            db.delete(p)

        db.commit()
        print("✅ Consolidation complete!")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_fuub_profiles()
