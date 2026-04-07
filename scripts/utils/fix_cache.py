
from backend.database import SessionLocal
from backend import models
from sqlalchemy import func, update

db = SessionLocal()

print("Starting Cache Recalculation...")

# Aggregated Query
print("Calculating stats from Transactions...")
stats = db.query(
    models.Transaction.track_id, 
    func.sum(models.Transaction.streams).label('total_streams'),
    func.sum(models.Transaction.royalties_value).label('total_revenue')
).filter(models.Transaction.track_id.isnot(None)).group_by(models.Transaction.track_id).all()

print(f"Found stats for {len(stats)} tracks.")

# Bulk Update Logic
count = 0
for track_id, t_streams, t_revenue in stats:
    db.query(models.Track).filter(models.Track.id == track_id).update({
        "cached_streams": int(t_streams or 0),
        "cached_revenue": float(t_revenue or 0.0)
    })
    count += 1

db.commit()
print(f"Updated {count} tracks successfully!")
db.close()
