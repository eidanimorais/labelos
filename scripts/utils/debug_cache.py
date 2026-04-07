
from backend.database import SessionLocal
from backend import models
from sqlalchemy import func

db = SessionLocal()

# 1. Check Total Tracks and Transactions
total_tracks = db.query(models.Track).count()
total_transactions = db.query(models.Transaction).count()

print(f"Total Tracks: {total_tracks}")
print(f"Total Transactions: {total_transactions}")

# 2. Check if Transactions have track_id
transactions_with_link = db.query(models.Transaction).filter(models.Transaction.track_id.isnot(None)).count()
print(f"Transactions with track_id: {transactions_with_link}")

# 3. Check values in Transaction vs Cached
# Pick a random track with transactions
sample_track = db.query(models.Track).filter(models.Track.cached_streams == 0).first()

if sample_track:
    print(f"Sample Track ID: {sample_track.id} - {sample_track.title}")
    print(f"Cached Streams: {sample_track.cached_streams}")
    
    # Calculate real queries
    real_streams = db.query(func.sum(models.Transaction.streams)).filter(models.Transaction.track_id == sample_track.id).scalar()
    print(f"Real Calculated Streams: {real_streams}")
else:
    print("All tracks have cached_streams > 0 (Great!)")

db.close()
