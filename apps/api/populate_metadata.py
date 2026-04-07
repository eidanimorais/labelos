from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Track
from backend.database import SQLALCHEMY_DATABASE_URL

# Fix path if needed, similar to migration script
# But if run from root with python -m ... it might be fine.
# Let's try to assume run from root.

def populate():
    engine = create_engine("sqlite:///./royalties.db")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Find the track
        track = db.query(Track).filter(Track.musica_display.like("%Não me entrego%")).first()
        if track:
            print(f"Found track: {track.musica_display} (ID: {track.id})")
            track.release_date = "18 de maio de 2025"
            track.duration = "3:13"
            db.commit()
            print("Updated release_date and duration.")
        else:
            print("Track 'Não me entrego' not found.")
            
            # List all tracks just in case
            print("Available tracks:")
            tracks = db.query(Track).limit(10).all()
            for t in tracks:
                print(f"- {t.musica_display}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate()
