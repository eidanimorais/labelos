from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, models

router = APIRouter(prefix="/splits", tags=["splits"])

@router.get("/{track_id}", response_model=List[schemas.Split])
def get_splits(track_id: int, db: Session = Depends(get_db)):
    splits = db.query(models.Split).filter(models.Split.track_id == track_id).all()
    
    # Enrich with profile photos
    enriched_splits = []
    for s in splits:
        profile = db.query(models.Profile).filter(models.Profile.name.ilike(s.participant_name)).first()
        s_dict = s.__dict__
        s_dict['profile_photo'] = profile.photo_url if profile else None
        enriched_splits.append(s_dict)
        
    return enriched_splits

@router.post("/{track_id}", response_model=List[schemas.Split])
def update_splits(track_id: int, splits: List[schemas.SplitCreate], db: Session = Depends(get_db)):
    # Fetch track to get label_share
    track = db.query(models.Track).filter(models.Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
        
    label_share_pct = track.label_share if track.label_share is not None else 0.40
    label_share_gross = label_share_pct * 100.0

    # Validate sum (Splits + Label == 100)
    total_splits = sum(s.percentage for s in splits)
    current_total = total_splits + label_share_gross
    
    if abs(current_total - 100.0) > 0.01:
        raise HTTPException(status_code=400, detail=f"A soma das porcentagens ({total_splits}%) + Label ({label_share_gross}%) deve ser 100%")
    
    # Clear existing splits
    db.query(models.Split).filter(models.Split.track_id == track_id).delete()
    
    new_splits_db = []
    for s in splits:
        new_split = models.Split(
            track_id=track_id, 
            participant_name=s.participant_name,
            role=s.role,
            percentage=s.percentage
        )
        db.add(new_split)
        new_splits_db.append(new_split)
    
    db.commit()
    
    # Re-query and enrich
    created_splits = db.query(models.Split).filter(models.Split.track_id == track_id).all()
    enriched_splits = []
    for s in created_splits:
        profile = db.query(models.Profile).filter(models.Profile.name.ilike(s.participant_name)).first()
        s_dict = s.__dict__
        s_dict['profile_photo'] = profile.photo_url if profile else None
        enriched_splits.append(s_dict)
        
    return enriched_splits
