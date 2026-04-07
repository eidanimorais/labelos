from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict
from pydantic import BaseModel
from ..database import get_db
from .. import models

router = APIRouter(prefix="/artists", tags=["artists"])

from .auth import get_current_user

@router.get("/search")
def search_artists(q: str = "", db: Session = Depends(get_db), current_user: models.Profile = Depends(get_current_user)):
    if current_user.is_admin != "admin":
        return [current_user.name]

    # Find unique participant names that match the query
    query = db.query(models.Split.participant_name).distinct()
    if q:
        query = query.filter(models.Split.participant_name.ilike(f"%{q}%"))
    
    # Also include names from Profile table
    profile_query = db.query(models.Profile.name).distinct()
    if q:
        profile_query = profile_query.filter(models.Profile.name.ilike(f"%{q}%"))
    
    # Combine and deduplicate
    all_names = set([name for (name,) in query.all()] + [name for (name,) in profile_query.all()])
    # Remove None/Empty and sort
    results = sorted([name for name in all_names if name], key=str.lower)
    
    return results[:20] # Return top 20

class PlatformStat(BaseModel):
    name: str # e.g. Spotify, Apple
    streams: int
    revenue: float

class QuarterlyStat(BaseModel):
    streams: int
    revenue: float

class ArtistTrackStats(BaseModel):
    id: int
    musica: str
    isrc: str
    role: Optional[str]
    percentage: float
    label_share: float = 0.40
    total_track_streams: int
    total_track_revenue: float
    artist_revenue: float
    platforms: List[PlatformStat] = []
    history: Dict[str, QuarterlyStat] = {}


class ArtistChartData(BaseModel):
    name: str # e.g. "2024-Q1"
    value: float

class ArtistProfile(BaseModel):
    name: str
    total_revenue: float
    total_streams: int
    tracks_count: int
    revenue_by_quarter: List[ArtistChartData]
    payment_history: List[ArtistChartData] = []
    tracks: List[ArtistTrackStats]
    bank: Optional[str] = None
    photo_url: Optional[str] = None

@router.get("/{name_slug}", response_model=ArtistProfile)
def get_artist_profile(name_slug: str, db: Session = Depends(get_db), current_user: models.Profile = Depends(get_current_user)):
    try:
        # 1. Find all splits for this artist by slug
        # We fetch all unique participant names and find the one that matches the slug
        all_names = db.query(models.Split.participant_name).distinct().all()
        target_name = None
        
        for (p_name,) in all_names:
            if not p_name: continue
            # Generate slug for this name
            # Generate slug for this name (alphanumeric only)
            slug = "".join(filter(str.isalnum, p_name.lower()))
            # Normalize the incoming slug as well to allow dashes in URL to match
            clean_input_slug = "".join(filter(str.isalnum, name_slug.lower()))
            
            if slug == clean_input_slug:
                target_name = p_name
                break
        
        # Security Check: Artist can only see their own profile
        if current_user.is_admin != "admin":
            if target_name != current_user.name:
                 raise HTTPException(status_code=403, detail="Acesso negado")
                 
        if not target_name:
             # Fallback: try exact match just in case
            target_name = name_slug

        # 1.1 Fetch Profile for Bank Info and Photo
        bank_info = None
        photo_url = None
        try:
            # Ideally should join, but simple lookup is fine here
            profile_db = db.query(models.Profile).filter(models.Profile.name == target_name).first()
            if profile_db:
                bank_info = profile_db.bank
                photo_url = profile_db.photo_url
        except Exception as e:
            print(f"Error fetching profile/bank: {e}")
            pass # Ignore if bank info fails

        splits = db.query(models.Split).filter(models.Split.participant_name == target_name).all()
        
        if not splits:
            return ArtistProfile(
                name=target_name, 
                total_revenue=0, 
                total_streams=0, 
                tracks_count=0, 
                revenue_by_quarter=[], 
                tracks=[],
                bank=bank_info,
                photo_url=photo_url
            )

        total_revenue = 0.0
        total_streams = 0 
        
        artist_tracks = []
        
        # Dictionary to aggregate revenue by quarter: {'2024-Q1': 150.50, ...}
        quarter_agg = {}

        for split in splits:
            track = split.track
            if not track:
                continue
                
            # 1. Total Stats for this track
            # 1. Total Stats for this track
            stats = db.query(
                func.sum(models.Transaction.streams),
                func.sum(models.Transaction.royalties_value)
            ).filter(models.Transaction.raw_isrc == track.isrc).first()
            
            track_streams = stats[0] or 0
            track_revenue = stats[1] or 0.0
            
            my_revenue = track_revenue * (split.percentage / 100.0)
            
            total_revenue += my_revenue
            total_streams += track_streams 
            
            # 2. Revenue Breakdown by Quarter for this track
            # We need this to build the chart
            # Query: Period, Sum(Revenue) for this ISRC
            quarters = db.query(
                models.Transaction.trimestre,
                func.sum(models.Transaction.royalties_value),
                func.sum(models.Transaction.streams)
            ).filter(models.Transaction.raw_isrc == track.isrc).group_by(models.Transaction.trimestre).all()
            
            track_history = {}

            for q_name, q_rev, q_streams in quarters:
                if not q_name: continue
                val = (q_rev or 0.0) * (split.percentage / 100.0)
                
                # Update global aggregate for the chart
                quarter_agg[q_name] = quarter_agg.get(q_name, 0.0) + val
                
                # Update track history for filtering
                track_history[q_name] = QuarterlyStat(
                    streams=q_streams or 0,
                    revenue=val
                )
            
            # 3. Platform Stats
            platform_results = db.query(
                models.Transaction.source,
                func.sum(models.Transaction.streams),
                func.sum(models.Transaction.royalties_value)
            ).filter(models.Transaction.raw_isrc == track.isrc).group_by(models.Transaction.source).all()
            
            platform_stats = []
            for plat, p_streams, p_rev in platform_results:
                p_rev_total = p_rev or 0.0
                p_my_rev = p_rev_total * (split.percentage / 100.0)
                platform_stats.append(PlatformStat(
                    name=plat,
                    streams=p_streams or 0,
                    revenue=p_my_rev
                ))
                
            platform_stats.sort(key=lambda x: x.revenue, reverse=True)
            
            artist_tracks.append(ArtistTrackStats(
                id=track.id,
                musica=track.title,
                isrc=track.isrc,
                role=split.role or "Collaborator",
                percentage=split.percentage,
                total_track_streams=track_streams,
                total_track_revenue=track_revenue,
                artist_revenue=my_revenue,
                platforms=platform_stats,
                history=track_history
            ))
            
        # Sort tracks by revenue DESC
        artist_tracks.sort(key=lambda x: x.artist_revenue, reverse=True)

        # Convert quarter_agg to list and sort
        if not quarter_agg:
            revenue_chart = []
        else:
            # 1. Determine the latest quarter
            sorted_keys = sorted(quarter_agg.keys())
            last_q = sorted_keys[-1]
            
            # 2. Generate the last 5 quarters keys
            def get_previous_quarter(q_str):
                # q_str format "YYYY-QQ" e.g. "2025-Q1"
                if not q_str or '-' not in q_str: return q_str
                try:
                    parts = q_str.split('-')
                    year = int(parts[0])
                    q_num = int(parts[1].replace('Q', ''))
                    
                    prev_q_num = q_num - 1
                    prev_year = year
                    if prev_q_num < 1:
                        prev_q_num = 4
                        prev_year -= 1
                    return f"{prev_year}-Q{prev_q_num}"
                except:
                    return q_str

            target_quarters = [last_q]
            current = last_q
            for _ in range(4):
                prev = get_previous_quarter(current)
                target_quarters.insert(0, prev) # Prepend
                current = prev
                
            # 3. Build chart data with 0 filling
            revenue_chart = []
            for q in target_quarters:
                val = quarter_agg.get(q, 0.0)
                revenue_chart.append(ArtistChartData(name=q, value=val))

        # Build full payment history (sorted DESC)
        payment_history = []
        if quarter_agg:
            for q in sorted(quarter_agg.keys(), reverse=True):
                payment_history.append(ArtistChartData(name=q, value=quarter_agg[q]))

        return ArtistProfile(
            name=target_name,
            total_revenue=total_revenue,
            total_streams=total_streams,
            tracks_count=len(artist_tracks),
            revenue_by_quarter=revenue_chart,
            payment_history=payment_history,
            tracks=artist_tracks,
            bank=bank_info,
            photo_url=photo_url
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
