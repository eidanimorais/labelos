from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import unicodedata
import re
from datetime import datetime, timedelta
from ..database import get_db
from .. import models
from .auth import get_current_user

def python_slugify(text):
    if not text:
        return ""
    # Normalize NFD to separate accents
    text = unicodedata.normalize('NFD', text)
    # Filter out non-spacing mark characters (accents)
    text = "".join([c for c in text if unicodedata.category(c) != 'Mn'])
    text = text.lower()
    # Remove all non-word characters except hyphens and spaces
    text = re.sub(r'[^\w\s-]', '', text).strip()
    # Replace spaces and hyphens with a single hyphen
    text = re.sub(r'[-\s]+', '-', text)
    return text

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/song/{name}")
def get_song_details(name: str, db: Session = Depends(get_db), current_user: models.Profile = Depends(get_current_user)):
    """
    Fetch aggregated stats for a song identified by its slug.
    This groups multiple ISRCs (versions) under the same title.
    """
    # 1. Fetch all unique titles and find all variations matching the slug
    all_titles = db.query(models.Track.title).distinct().all()
    target_titles = []
    for (title,) in all_titles:
        if title and python_slugify(title) == name:
            target_titles.append(title)
    
    if not target_titles:
        # Fallback: try a direct ILIKE search if no slug match found
        fallback = db.query(models.Track).filter(models.Track.title.ilike(f"%{name.replace('-', ' ')}%")).first()
        if fallback:
            target_titles = [fallback.title]
        else:
            return None

    # 2. Get all tracks (versions) matching ANY of the titles found
    query = db.query(models.Track).filter(models.Track.title.in_(target_titles))
    
    if current_user.is_admin != "admin":
        query = query.join(models.Split).filter(models.Split.participant_name == current_user.name)
        
    tracks = query.all()
    if not tracks:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    track_ids = [t.id for t in tracks]
    
    # 3. Aggregate Stats across all versions
    total_revenue = db.query(func.sum(models.Transaction.royalties_value))\
        .filter(models.Transaction.track_id.in_(track_ids)).scalar() or 0.0
    
    total_streams = db.query(func.sum(models.Transaction.streams))\
        .filter(models.Transaction.track_id.in_(track_ids)).scalar() or 0
    
    spotify_streams = db.query(func.sum(models.Transaction.streams))\
        .filter(models.Transaction.track_id.in_(track_ids), models.Transaction.source.ilike('%spotify%')).scalar() or 0

    # New: Analytics Streams (from DailyAnalytics table)
    # Sum the latest entry for each version
    analytics_streams = 0
    for tid in track_ids:
        latest_entry = db.query(models.DailyAnalytics.total_streams)\
            .filter(models.DailyAnalytics.track_id == tid)\
            .order_by(models.DailyAnalytics.date.desc())\
            .first()
        if latest_entry:
            analytics_streams += latest_entry[0]

    # New: Daily History (Last 30 days)
    # Group by date, sum streams across all versions
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    daily_history_q = db.query(
        models.DailyAnalytics.date,
        func.sum(models.DailyAnalytics.total_streams).label("total")
    ).filter(
        models.DailyAnalytics.track_id.in_(track_ids),
        models.DailyAnalytics.date >= thirty_days_ago
    ).group_by(models.DailyAnalytics.date).order_by(models.DailyAnalytics.date).all()
    
    # Format for chart: "8 de jan.", value
    # Function to format date like "11 de jan."
    def format_chart_date(dt):
        return dt.strftime("%d de %b.").lower().replace('jan', 'jan').replace('feb', 'fev').replace('mar', 'mar').replace('apr', 'abr').replace('may', 'mai').replace('jun', 'jun').replace('jul', 'jul').replace('aug', 'ago').replace('sep', 'set').replace('oct', 'out').replace('nov', 'nov').replace('dec', 'dez')

    daily_history = []
    
    # Calendar Month Logic
    now = datetime.utcnow()
    
    # Current Month (e.g. Feb 1 to Now)
    start_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Last Month (e.g. Jan 1 to Jan 31)
    last_month_end = start_current - timedelta(seconds=1)
    start_last = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # 2 Months Ago (e.g. Dec 1 to Dec 31)
    two_months_end = start_last - timedelta(seconds=1)
    start_two_months = two_months_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Last 28 Days (Rolling)
    # Use 29 days to account for UTC shift and ensure inclusive boundaries (e.g. Jan 8 to Today)
    start_28_days = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=29)
    
    # KPIs Calculation
    period_current_streams = db.query(func.sum(models.DailyAnalytics.total_streams))\
        .filter(
            models.DailyAnalytics.track_id.in_(track_ids),
            models.DailyAnalytics.date >= start_current
        ).scalar() or 0

    period_last_28 = db.query(func.sum(models.DailyAnalytics.total_streams))\
        .filter(
            models.DailyAnalytics.track_id.in_(track_ids),
            models.DailyAnalytics.date >= start_28_days
        ).scalar() or 0

    period_prev_streams = db.query(func.sum(models.DailyAnalytics.total_streams))\
        .filter(
            models.DailyAnalytics.track_id.in_(track_ids),
            models.DailyAnalytics.date >= start_last,
            models.DailyAnalytics.date <= last_month_end
        ).scalar() or 0

    two_months_ago_q = db.query(func.sum(models.DailyAnalytics.total_streams))\
        .filter(
            models.DailyAnalytics.track_id.in_(track_ids),
            models.DailyAnalytics.date >= start_two_months,
            models.DailyAnalytics.date <= two_months_end
        ).scalar() or 0
        
    # Percent Change (Current Month vs SAME DAYS Previous Month? Or Total vs Total?)
    # Usually Month vs Month implies Total vs Total, but if Current is incomplete (Feb 5), 
    # comparing to Full Jan is unfair. 
    # Ideally compare Feb 1-5 vs Jan 1-5.
    # User didn't specify, but "Mês atual" implies accumulating.
    # Let's keep Total vs Total for simplicity unless requested otherwise, 
    # OR better: Compare Daily Average?
    # Simple change % of totals is standard.
    
    pct_change = 0
    # Change logic: Compare Previous (Complete) vs Two Months Ago (Complete)
    if two_months_ago_q > 0:
        pct_change = ((period_prev_streams - two_months_ago_q) / two_months_ago_q) * 100
    else:
        # Fallback if baseline is 0
        pct_change = 0 if period_prev_streams == 0 else 100

    # History: Fetch starting from 2 months ago to now (to support graph switching)
    daily_history_q = db.query(
        models.DailyAnalytics.date,
        func.sum(models.DailyAnalytics.total_streams).label("total")
    ).filter(
        models.DailyAnalytics.track_id.in_(track_ids),
        models.DailyAnalytics.date >= start_two_months 
    ).group_by(models.DailyAnalytics.date).order_by(models.DailyAnalytics.date).all()
    
    # Reuse formatting function
    def format_chart_date(dt):
        return dt.strftime("%d de %b.").lower().replace('jan', 'jan').replace('feb', 'fev').replace('mar', 'mar').replace('apr', 'abr').replace('may', 'mai').replace('jun', 'jun').replace('jul', 'jul').replace('aug', 'ago').replace('sep', 'set').replace('oct', 'out').replace('nov', 'nov').replace('dec', 'dez')

    # Aggregate in Python
    agg_history = {}
    for date_val, val_sum in daily_history_q:
        d_key = date_val.strftime("%Y-%m-%d")
        if d_key not in agg_history:
             agg_history[d_key] = {
                 "date": format_chart_date(date_val),
                 "full_date": d_key,
                 "value": 0
             }
        agg_history[d_key]["value"] += val_sum

    daily_history = list(agg_history.values())
    daily_history.sort(key=lambda x: x["full_date"])


    # 4. Timeline (Revenue per Quarter aggregated)
    timeline = db.query(
        models.Transaction.trimestre,
        func.sum(models.Transaction.royalties_value).label("total")
    ).filter(models.Transaction.track_id.in_(track_ids))\
     .group_by(models.Transaction.trimestre)\
     .order_by(models.Transaction.trimestre.desc())\
     .limit(8).all()
    timeline = timeline[::-1]

    # 5. Versions Details List
    versions = []
    for t in tracks:
        # Stats for this specific version
        v_rev = db.query(func.sum(models.Transaction.royalties_value)).filter(models.Transaction.track_id == t.id).scalar() or 0.0
        v_streams = db.query(func.sum(models.Transaction.streams)).filter(models.Transaction.track_id == t.id).scalar() or 0
        
        versions.append({
            "id": t.id,
            "isrc": t.isrc,
            "title": t.title,
            "version_type": t.version,
            "revenue": v_rev,
            "streams": v_streams,
            "artist": t.artist.name if t.artist else "Unknown",
            "display_status": t.display_status
        })

    # General artist display (first available)
    main_artist = "Unknown"
    for v in versions:
        if v["artist"] != "Unknown":
            main_artist = v["artist"]
            break

    return {
        "title": target_titles[0],
        "artist": main_artist,
        "total_revenue": total_revenue,
        "total_streams": total_streams,
        "analytics_streams": analytics_streams,
        "analytics_history": daily_history,
        "analytics_period": {
             "current": period_current_streams,
             "previous": period_prev_streams,
             "two_months_ago": two_months_ago_q,
             "last_28_days": period_last_28,
             "change_pct": pct_change
        },
        "spotify_streams": spotify_streams,
        "timeline": [{"trimestre": t[0], "value": t[1]} for t in timeline],
        "versions": versions
    }


@router.get("/dashboard")
def get_dashboard_stats(trimestre: str = None, db: Session = Depends(get_db), current_user: models.Profile = Depends(get_current_user)):
    query = db.query(models.Transaction)
    
    if current_user.is_admin != "admin":
        # Narrow down transactions to those where user is a participant
        # This is a bit complex because we need to join splits
        query = query.join(models.Track).join(models.Split).filter(models.Split.participant_name == current_user.name)

    if trimestre:
        query = query.filter(models.Transaction.trimestre == trimestre)
    
    # KPIs
    # For artists, we calculate their SHARE of royalties
    if current_user.is_admin != "admin":
        # Aggregate revenue by share
        total_royalties = 0.0
        # We need a more complex query or manual calculation if we want precise share
        # For the dashboard KPI, let's use a simplified sum for now or just filter by participant
        # Actually, let's calculate the real share for the artist
        artist_revenue_res = db.query(
            func.sum(models.Transaction.royalties_value * (models.Split.percentage / 100.0))
        ).join(models.Track, models.Transaction.track_id == models.Track.id)\
         .join(models.Split, models.Split.track_id == models.Track.id)\
         .filter(models.Split.participant_name == current_user.name)
        
        if trimestre:
            artist_revenue_res = artist_revenue_res.filter(models.Transaction.trimestre == trimestre)
        
        total_royalties = artist_revenue_res.scalar() or 0.0
    else:
        total_royalties = query.with_entities(func.sum(models.Transaction.royalties_value)).scalar() or 0.0

    total_streams = query.with_entities(func.sum(models.Transaction.streams)).scalar() or 0
    
    # Unique tracks -> Count Distinct Track IDs linked in Transactions
    # or distinct ISrcs if we rely on raw data? Better rely on Track IDs for 'smart' count.
    # But if import failed to link, we might miss them. Let's use Track ID.
    unique_tracks_count = query.with_entities(func.count(func.distinct(models.Transaction.track_id))).scalar() or 0
    
    # Platform breakdown
    platform_stats = db.query(
        models.Transaction.source,
        func.sum(models.Transaction.royalties_value).label("total")
    ).group_by(models.Transaction.source).order_by(func.sum(models.Transaction.royalties_value).desc()).all()
    
    # Territory breakdown
    territory_stats = db.query(
        models.Transaction.territorio,
        func.sum(models.Transaction.royalties_value).label("total")
    ).group_by(models.Transaction.territorio).order_by(func.sum(models.Transaction.royalties_value).desc()).limit(10).all()
    
    # Top Tracks (By Revenue) & Trend Calculation
    # 1. Determine latest quarters for trend comparison
    latest_quarters = db.query(models.Transaction.trimestre).distinct().order_by(models.Transaction.trimestre.desc()).limit(2).all()
    q_current = latest_quarters[0][0] if latest_quarters else None
    q_prev = latest_quarters[1][0] if len(latest_quarters) > 1 else None

    # 2. Query Top Tracks with Artist Name and Streams
    # Priority for display: raw_artist (complete list) falling back to Profile name
    top_tracks_query = db.query(
        models.Track.id,
        models.Track.title,
        func.coalesce(func.max(models.Transaction.raw_artist), models.Profile.name).label("artist_name"),
        func.sum(models.Transaction.royalties_value).label("total_royalties"),
        func.sum(models.Transaction.streams).label("total_streams")
    ).join(models.Track, models.Transaction.track_id == models.Track.id)\
     .outerjoin(models.Profile, models.Track.artist_id == models.Profile.id)\
     .group_by(models.Track.id, models.Profile.name)\
     .order_by(func.sum(models.Transaction.royalties_value).desc()).limit(10).all()

    # 3. Process each track to calculate specific quarterly trend
    top_tracks_processed = []
    for t in top_tracks_query:
        # Fetch Revenue for Current vs Previous Quarter for this specific track
        val_curr = 0
        val_prev = 0
        
        if q_current:
            val_curr = db.query(func.sum(models.Transaction.royalties_value))\
                .filter(models.Transaction.track_id == t.id, models.Transaction.trimestre == q_current).scalar() or 0.0
        
        if q_prev:
            val_prev = db.query(func.sum(models.Transaction.royalties_value))\
                .filter(models.Transaction.track_id == t.id, models.Transaction.trimestre == q_prev).scalar() or 0.0
        
        trend_pct = 0.0
        if val_prev > 0:
            trend_pct = ((val_curr - val_prev) / val_prev) * 100
        elif val_curr > 0 and q_prev: 
             # If no revenue in prev quarter but revenue in current, technically infinity, but let's cap or show 100%
             trend_pct = 100.0

        top_tracks_processed.append({
            "name": t.title,
            "artist": t.artist_name or "Unknown",
            "value": t.total_royalties,
            "streams": t.total_streams,
            "trend": trend_pct
        })

    # Revenue by Quarter (Last 8)
    revenue_by_quarter = db.query(
        models.Transaction.trimestre,
        func.sum(models.Transaction.royalties_value).label("total")
    ).group_by(models.Transaction.trimestre).order_by(models.Transaction.trimestre.desc()).limit(8).all()
    
    # Reverse to show chronological order
    revenue_by_quarter = revenue_by_quarter[::-1]

    return {
        "kpis": {
            "total_royalties": total_royalties,
            "total_streams": total_streams,
            "unique_tracks": unique_tracks_count
        },
        "charts": {
            "by_platform": [{"name": p[0], "value": p[1]} for p in platform_stats],
            "by_territory": [{"name": t[0], "value": t[1]} for t in territory_stats],
            "top_tracks": top_tracks_processed,
            "revenue_by_quarter": [{"name": q[0], "value": q[1]} for q in revenue_by_quarter]
        }
    }

@router.get("/territories")
def get_all_territories_stats(db: Session = Depends(get_db)):
    total_royalties = db.query(func.sum(models.Transaction.royalties_value)).scalar() or 0.0
    
    territories = db.query(
        models.Transaction.territorio,
        func.sum(models.Transaction.royalties_value).label("total"),
        func.sum(models.Transaction.streams).label("streams")
    ).group_by(models.Transaction.territorio).order_by(func.sum(models.Transaction.royalties_value).desc()).all()
    
    return {
        "total_revenue": total_royalties,
        "territories": [{"name": t[0], "value": t[1], "streams": t[2]} for t in territories]
    }

@router.get("/compare")
def compare_tracks_analytics(
    track_ids: str,  # Comma separated IDs: "1,2,3"
    period: int = 28, 
    db: Session = Depends(get_db)
):
    ids = [int(id) for id in track_ids.split(",") if id.isdigit()]
    
    results = []
    
    for tid in ids:
        # Get Track Info
        track = db.query(models.Track).filter(models.Track.id == tid).first()
        if not track:
            continue
            
        # Get Analytics sorted by date (Last N days)
        cutoff_date = datetime.utcnow() - timedelta(days=period)
        
        analytics = db.query(models.DailyAnalytics)\
            .filter(models.DailyAnalytics.track_id == tid)\
            .filter(models.DailyAnalytics.date >= cutoff_date)\
            .order_by(models.DailyAnalytics.date.asc())\
            .all()
            
        # Robust Date Filling (Last N days)
        date_map = {}
        # Start date setup: ensure we cover the requested period ending close to now
        base_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=period)
        
        ordered_dates = []
        for i in range(period):
            # i=0 -> base + 1 day. i=period-1 -> base + period (today)
            d = base_date + timedelta(days=i + 1)
            d_str = d.strftime("%d/%m/%Y")
            date_map[d_str] = 0
            ordered_dates.append(d_str)
            
        if analytics:
            for entry in analytics:
                d_str = entry.date.strftime("%d/%m/%Y")
                if d_str in date_map:
                    date_map[d_str] += entry.total_streams

        normalized_data = []
        for idx, d_str in enumerate(ordered_dates):
            normalized_data.append({
                "day": f"Dia {idx + 1}",
                "value": date_map[d_str],
                "date": d_str
            })

        results.append({
            "track_id": track.id,
            "title": track.title,
            "artist": track.artist_name or (track.artist.name if track.artist else "Unknown"),
            "cover_image": track.cover_url,
            "data": normalized_data,
            "total_period": sum([d["value"] for d in normalized_data])
        })
        
    return {"results": results}

@router.get("/track/{isrc}")
def get_track_details(isrc: str, db: Session = Depends(get_db), current_user: models.Profile = Depends(get_current_user)):
    track = db.query(models.Track).filter(models.Track.isrc == isrc).first()
    
    if not track:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Track not found")

    if current_user.is_admin != "admin":
        is_participant = db.query(models.Split).filter(models.Split.track_id == track.id, models.Split.participant_name == current_user.name).first()
        if not is_participant:
            raise HTTPException(status_code=403, detail="Acesso negado")

    track_display = track.title
    artist_display = "Unknown" 
    if track.artist:
        artist_display = track.artist.name
        
    splits = track.splits

    # Revenue linked to this Track ID
    total_revenue = db.query(func.sum(models.Transaction.royalties_value))\
        .filter(models.Transaction.track_id == track.id).scalar() or 0.0
    
    total_streams = db.query(func.sum(models.Transaction.streams))\
        .filter(models.Transaction.track_id == track.id).scalar() or 0

    spotify_streams = db.query(func.sum(models.Transaction.streams))\
        .filter(models.Transaction.track_id == track.id, models.Transaction.source.ilike('%spotify%')).scalar() or 0

    # Revenue Rank (Latest Quarter)
    # 1. Determine latest quarter
    latest_q_row = db.query(models.Transaction.trimestre).distinct().order_by(models.Transaction.trimestre.desc()).first()
    current_rank = 0
    total_isrcs = 0
    
    if latest_q_row:
        q_name = latest_q_row[0]
        # 2. Get revenue for all tracks in that quarter, grouped by track_id
        # We use a subquery or direct aggregation
        rankings = db.query(
            models.Transaction.track_id, 
            func.sum(models.Transaction.royalties_value).label('rev')
        ).filter(models.Transaction.trimestre == q_name)\
         .group_by(models.Transaction.track_id)\
         .order_by(desc('rev')).all()
         
        total_isrcs = len(rankings)
         
        # 3. Find rank
        for idx, (tid, rev) in enumerate(rankings):
             if tid == track.id:
                 current_rank = idx + 1
                 break

    # Timeline
    timeline = db.query(
        models.Transaction.trimestre,
        func.sum(models.Transaction.royalties_value).label("total")
    ).filter(models.Transaction.track_id == track.id)\
     .group_by(models.Transaction.trimestre)\
     .order_by(models.Transaction.trimestre.desc())\
     .limit(8).all()
    timeline = timeline[::-1]

    # Royalty Breakdown
    label_share_pct = track.label_share or 0.40
    label_name_str = "GRAV Produção Musical" # Default or from track
    
    label_amount = total_revenue * label_share_pct
    label_data = {
        "name": label_name_str,
        "role": "Label",
        "gross_percentage": round(label_share_pct * 100, 2),
        "amount": label_amount
    }

    net_revenue_pool = total_revenue - label_amount
    net_share_pct = 1.0 - label_share_pct
    
    collaborators_data = []
    if splits:
        for split in splits:
            gross_pct_val = split.percentage
            amount = total_revenue * (gross_pct_val / 100.0)
            
            current_net_pct = 0
            if net_share_pct > 0:
                current_net_pct = (gross_pct_val / 100.0) / net_share_pct * 100
                
            collaborators_data.append({
                "name": split.participant_name,
                "role": split.role,
                "gross_percentage": round(gross_pct_val, 2),
                "net_percentage": round(current_net_pct, 2),
                "amount": amount
            })

    return {
        "id": track.id,
        "isrc": isrc,
        "title": track_display,
        "artist": artist_display,
        "total_revenue": total_revenue,
        "total_streams": total_streams,
        "spotify_streams": spotify_streams,
        "revenue_rank": current_rank,
        "total_isrcs": total_isrcs,
        "timeline": [{"trimestre": t[0], "value": t[1]} for t in timeline],
        "royalty_breakdown": {
            "label_commission": label_data,
            "net_revenue_pool": net_revenue_pool,
            "net_share_percentage": round(net_share_pct * 100, 2),
            "collaborators": collaborators_data
        },
        # Metadata
        "duration": track.duration,
        "cover_image": track.cover_url,
        "release_date": track.release_date,
        "master_audio_url": track.master_audio_url,
        "master_cover_url": track.master_cover_url,
        "composer": track.composer,
        "producer": track.producer,
        "audio_engineer": track.audio_engineer,
        "genre": track.genre
    }

