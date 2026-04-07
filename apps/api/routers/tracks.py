import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload, subqueryload
from sqlalchemy import func
from typing import List
from ..database import get_db
from .. import schemas, models
from ..services.storage_service import upload_to_r2, delete_from_r2
from ..services.google_drive_service import get_drive_service
from fastapi import File, UploadFile, HTTPException
from .auth import get_current_user

router = APIRouter(prefix="/tracks", tags=["tracks"])

@router.get("/quarters", response_model=List[str])
def list_available_quarters(db: Session = Depends(get_db)):
    # Order by most recent first
    results = db.query(models.Transaction.trimestre).distinct().order_by(models.Transaction.trimestre.desc()).all()
    return [r[0] for r in results if r[0]]

@router.get("/platforms", response_model=List[str])
def list_available_platforms(db: Session = Depends(get_db)):
    results = db.query(models.Transaction.source).distinct().order_by(models.Transaction.source).all()
    return [r[0] for r in results if r[0]]

@router.get("/count")
def count_tracks(trimestre: str = None, platform: str = None, db: Session = Depends(get_db)):
    # If filters active, aggregate from transactions
    if trimestre or platform:
        query = db.query(
            func.count(models.Transaction.track_id.distinct()),
            func.sum(models.Transaction.streams),
            func.sum(models.Transaction.royalties_value)
        )
        if trimestre:
            query = query.filter(models.Transaction.trimestre == trimestre)
        if platform:
            query = query.filter(models.Transaction.source == platform)
        
        counts = query.first()
        return {
            "total_tracks": counts[0] or 0,
            "total_streams": counts[1] or 0,
            "total_revenue": counts[2] or 0.0
        }

    # Optimized Count query
    total_tracks = db.query(func.count(models.Track.id)).scalar()
    
    # Calculate Totals (Streams & Revenue) from Transactions to be accurate
    # Or use Track cache if we trust it. Let's use Transactions for accuracy as per "no filters" request.
    totals = db.query(
        func.sum(models.Transaction.streams),
        func.sum(models.Transaction.royalties_value)
    ).first()

    total_streams = totals[0] or 0
    total_revenue = totals[1] or 0.0
    
    # Calculate "Cadastro Completo" (All columns filled)
    # Columns in UI: Capa (cover_url), Título (title), Artista (artist_name), Compositor (composer), ISRC (isrc), Gênero (genre), Lançamento (release_date), Áudio (master_audio_url)
    complete_registration_count = db.query(func.count(models.Track.id)).filter(
        models.Track.cover_url.isnot(None),
        models.Track.title.isnot(None),
        models.Track.artist_name.isnot(None),
        models.Track.composer.isnot(None),
        models.Track.isrc.isnot(None),
        models.Track.genre.isnot(None),
        models.Track.release_date.isnot(None),
        models.Track.master_audio_url.isnot(None)
    ).scalar()

    # Calculate "Split Completo" (Has entries in splits table)
    # Using exists/any to check for related splits
    complete_split_count = db.query(func.count(models.Track.id)).filter(models.Track.splits.any()).scalar()
    
    return {
        "total_tracks": total_tracks,
        "total_streams": total_streams,
        "total_revenue": total_revenue,
        "complete_registration_count": complete_registration_count or 0,
        "complete_split_count": complete_split_count or 0
    }
def _build_track_stats(track, streams, revenue, artist_name):
    # Aggregate all participants from splits to show multiple artists
    participants = []
    if track.splits:
        participants = [s.participant_name for s in track.splits if s.participant_name]
    
    # Priority: 1. Manual/Imported artist_name, 2. Profile name, 3. Consolidated names from Splits (Fallback), 4. Unknown
    artist_display = track.artist_name or (track.artist.name if track.artist else (", ".join(participants) if participants else (artist_name or "Unknown")))

    # We construct a dict manually to satisfy schemas.TrackStats
    track_dict = {
        "id": track.id,
        "isrc": track.isrc,
        "musica_display": track.title, # Mapping
        "musica_normalizada": track.title, # Mapping
        "version_type": track.version,
        "production_cost": track.production_cost,
        "label_share": track.label_share,
        "label_name": track.label_name,
        "artist": artist_display,
        "cover_image": track.cover_url,
        "master_audio_url": track.master_audio_url,
        "master_cover_url": track.master_cover_url,
        "display_status": track.display_status,
        "label_share": track.label_share or 0.40,
        
        # Extended Catalog Data
        "album": track.album,
        "track_number": track.track_number,
        "format": track.format,
        "producer": track.producer,
        "composer": track.composer,
        "genre": track.genre,
        "release_date": track.release_date,
        "duration": track.duration,
        "audio_engineer": track.audio_engineer,
        "key": track.key,
        "bpm": track.bpm,
        "publisher": track.publisher,
        "upc": track.upc,
        
        # Tech Sheet Fields
        "mixing_engineer": track.mixing_engineer,
        "mastering_engineer": track.mastering_engineer,
        "release_time_platforms": track.release_time_platforms,
        "release_time_youtube": track.release_time_youtube,
        "isrc_video": track.isrc_video,
        "explicit": track.explicit,
        "author_contact": track.author_contact,
        
        # Stats
        "total_streams": streams or 0,
        "total_revenue": revenue or 0.0,
        "status": "Live" if track.splits else "Pending"
    }
    
    splits = track.splits
    if splits:
        track_dict['split_count'] = len(splits)
        sorted_splits = sorted(splits, key=lambda s: s.percentage, reverse=True)
        track_dict['split_summary'] = [
            {"name": s.participant_name, "percentage": s.percentage, "role": s.role} 
            for s in sorted_splits
        ]
        track_dict['splits'] = [
             {"id": s.id, "participant_name": s.participant_name, "percentage": s.percentage, "participant_role": s.role, "track_id": track.id}
             for s in sorted_splits
        ]
    else:
        track_dict['split_count'] = 1
        track_dict['split_summary'] = [
            {"name": track_dict['artist'], "percentage": 100.0, "role": "Primary"}
        ]
        track_dict['splits'] = []

    return track_dict



@router.put("/{isrc}", response_model=schemas.Track)
def update_track(isrc: str, track_update: schemas.TrackUpdate, db: Session = Depends(get_db)):
    # This endpoint updates track metadata
    track = db.query(models.Track).filter(models.Track.isrc == isrc).first()
    
    if not track:
        # Create if not exists (Lazy creation)
        track = models.Track(isrc=isrc, title=track_update.musica_display or "Unknown Track")
        db.add(track)
        db.flush()
    
    if track_update.musica_display is not None:
        track.title = track_update.musica_display
    if track_update.version_type is not None:
        track.version = track_update.version_type
    if track_update.production_cost is not None:
        track.production_cost = track_update.production_cost
    
    # Artist Name Update (Persistent display name for this track)
    if track_update.artist is not None:
        track.artist_name = track_update.artist
    
    if track_update.display_status is not None:
        track.display_status = track_update.display_status
    if track_update.genre is not None:
        track.genre = track_update.genre
    if track_update.composer is not None:
        track.composer = track_update.composer
    if track_update.publisher is not None:
        track.publisher = track_update.publisher
    if track_update.upc is not None:
        track.upc = track_update.upc
    if track_update.bpm is not None:
        track.bpm = track_update.bpm
    if track_update.key is not None:
        track.key = track_update.key
    if track_update.producer is not None:
        track.producer = track_update.producer
    if track_update.audio_engineer is not None:
        track.audio_engineer = track_update.audio_engineer
    if track_update.duration is not None:
        track.duration = track_update.duration
    
    # Tech Sheet Fields
    if track_update.mixing_engineer is not None:
        track.mixing_engineer = track_update.mixing_engineer
    if track_update.mastering_engineer is not None:
        track.mastering_engineer = track_update.mastering_engineer
    if track_update.release_time_platforms is not None:
        track.release_time_platforms = track_update.release_time_platforms
    if track_update.release_time_youtube is not None:
        track.release_time_youtube = track_update.release_time_youtube
    if track_update.isrc_video is not None:
        track.isrc_video = track_update.isrc_video
    if track_update.explicit is not None:
        track.explicit = track_update.explicit
    if track_update.author_contact is not None:
        track.author_contact = track_update.author_contact
        
    db.commit()
    db.refresh(track)
    
    # Return matched schema
    return {
        "id": track.id,
        "isrc": track.isrc,
        "musica_display": track.title,
        "musica_normalizada": track.title,
        "version_type": track.version,
        "production_cost": track.production_cost,
        "splits": []
    }

@router.patch("/{track_id}", response_model=schemas.Track)
def patch_track(track_id: int, track_update: schemas.TrackUpdate, db: Session = Depends(get_db)):
    track = db.query(models.Track).filter(models.Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    if track_update.musica_display is not None:
        track.title = track_update.musica_display
    if track_update.version_type is not None:
        track.version = track_update.version_type
    if track_update.production_cost is not None:
        track.production_cost = track_update.production_cost
    
    if track_update.artist is not None:
        track.artist_name = track_update.artist
    
    if track_update.display_status is not None:
        track.display_status = track_update.display_status
    if track_update.genre is not None:
        track.genre = track_update.genre
    if track_update.composer is not None:
        track.composer = track_update.composer
    if track_update.publisher is not None:
        track.publisher = track_update.publisher
    if track_update.upc is not None:
        track.upc = track_update.upc
    if track_update.bpm is not None:
        track.bpm = track_update.bpm
    if track_update.key is not None:
        track.key = track_update.key
    if track_update.producer is not None:
        track.producer = track_update.producer
    if track_update.audio_engineer is not None:
        track.audio_engineer = track_update.audio_engineer
    if track_update.duration is not None:
        track.duration = track_update.duration
    if track_update.album is not None:
        track.album = track_update.album
    if track_update.format is not None:
        track.format = track_update.format
    if track_update.release_date is not None:
        track.release_date = track_update.release_date
    if track_update.track_number is not None:
        track.track_number = track_update.track_number
    
    # Tech Sheet Fields
    if track_update.mixing_engineer is not None:
        track.mixing_engineer = track_update.mixing_engineer
    if track_update.mastering_engineer is not None:
        track.mastering_engineer = track_update.mastering_engineer
    if track_update.release_time_platforms is not None:
        track.release_time_platforms = track_update.release_time_platforms
    if track_update.release_time_youtube is not None:
        track.release_time_youtube = track_update.release_time_youtube
    if track_update.isrc_video is not None:
        track.isrc_video = track_update.isrc_video
    if track_update.explicit is not None:
        track.explicit = track_update.explicit
    if track_update.author_contact is not None:
        track.author_contact = track_update.author_contact
        
    db.commit()
    db.refresh(track)
    
    # Return matched schema
    return {
        "id": track.id,
        "isrc": track.isrc,
        "musica_display": track.title,
        "musica_normalizada": track.title,
        "version_type": track.version,
        "production_cost": track.production_cost,
        "splits": []
    }

@router.get("/", response_model=List[schemas.TrackStats])
def list_tracks(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user: models.Profile = Depends(get_current_user)):
    # Optimized Query: Read directly from Track table (Stats are materialized)
    # No more JOINs with Transaction table for basic listing
    query = db.query(models.Track)\
        .options(joinedload(models.Track.artist))\
        .options(subqueryload(models.Track.splits))
    
    if current_user.is_admin != "admin":
        # Filter tracks where user is a participant in splits
        query = query.join(models.Split).filter(models.Split.participant_name == current_user.name)

    tracks = query.offset(skip).limit(limit).all()

    tracks_with_stats = []
    
    for track in tracks:
        # Resolve Artist Name fallback
        artist_name = "Unknown"
        if track.artist:
             artist_name = track.artist.name
        
        # Use cached values
        track_dict = _build_track_stats(track, track.cached_streams, track.cached_revenue, artist_name)
        tracks_with_stats.append(track_dict)

    return tracks_with_stats

@router.get("/grouped", response_model=List[schemas.TrackStats])
def list_tracks_grouped(
    skip: int = 0, 
    limit: int = 50, 
    trimestre: str = None, 
    platform: str = None, 
    q: str = None,
    sort_by: str = "total_revenue", 
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(get_current_user)
):
    # 1. Determine quarters for trend
    if trimestre:
        q_current = trimestre
        # Find the quarter immediately before the selected one
        q_prev_res = db.query(models.Transaction.trimestre)\
            .filter(models.Transaction.trimestre < q_current)\
            .distinct().order_by(models.Transaction.trimestre.desc()).first()
        q_prev = q_prev_res[0] if q_prev_res else None
    else:
        latest_quarters = db.query(models.Transaction.trimestre).distinct().order_by(models.Transaction.trimestre.desc()).limit(2).all()
        q_current = latest_quarters[0][0] if latest_quarters else None
        q_prev = latest_quarters[1][0] if len(latest_quarters) > 1 else None

    # 2. Get Aggregated Stats (Streams/Revenue) respecting filters
    # If filters are present, we MUST query transactions. If not, we can use cache as fallback for performance.
    
    # Base query for stats
    stats_query = db.query(
        models.Transaction.track_id,
        func.sum(models.Transaction.streams).label("streams"),
        func.sum(models.Transaction.royalties_value).label("revenue")
    )
    
    if trimestre:
        stats_query = stats_query.filter(models.Transaction.trimestre == trimestre)
    if platform:
        stats_query = stats_query.filter(models.Transaction.source == platform)
        
    if current_user.is_admin != "admin":
        stats_query = stats_query.join(models.Track).join(models.Split).filter(models.Split.participant_name == current_user.name)

    stats_results = stats_query.group_by(models.Transaction.track_id).all()
    stats_map = {r.track_id: {"streams": r.streams, "revenue": r.revenue} for r in stats_results}

    # 3. Get Revenue Mapping for Trend calculation
    rev_mapping = {} # {track_id: {q_current: val, q_prev: val}}
    quarters_to_fetch = [q for q in [q_current, q_prev] if q]
    
    if quarters_to_fetch:
        trend_q_query = db.query(
            models.Transaction.track_id,
            models.Transaction.trimestre,
            func.sum(models.Transaction.royalties_value)
        ).filter(models.Transaction.trimestre.in_(quarters_to_fetch))
        
        if current_user.is_admin != "admin":
             trend_q_query = trend_q_query.join(models.Track).join(models.Split).filter(models.Split.participant_name == current_user.name)
        
        if platform:
            trend_q_query = trend_q_query.filter(models.Transaction.source == platform)
            
        trend_results = trend_q_query.group_by(models.Transaction.track_id, models.Transaction.trimestre).all()
        
        for tid, trim, val in trend_results:
            if tid not in rev_mapping: rev_mapping[tid] = {}
            rev_mapping[tid][trim] = val

    # 4. Fetch Tracks
    query_tracks = db.query(models.Track)\
        .options(joinedload(models.Track.artist))\
        .options(subqueryload(models.Track.splits))
    
    if q:
        query_tracks = query_tracks.filter(
            (models.Track.title.ilike(f"%{q}%")) |
            (models.Track.isrc.ilike(f"%{q}%")) |
            (models.Track.artist_name.ilike(f"%{q}%"))
        )

    if current_user.is_admin != "admin":
        query_tracks = query_tracks.join(models.Split).filter(models.Split.participant_name == current_user.name)

    tracks = query_tracks.all()

    grouped_map = {}
    
    for track in tracks:
        # Use filtered stats if filters active, else use cache
        if trimestre or platform:
            s_data = stats_map.get(track.id, {"streams": 0, "revenue": 0.0})
            t_stats = _build_track_stats(track, s_data["streams"], s_data["revenue"], None)
        else:
            t_stats = _build_track_stats(track, track.cached_streams, track.cached_revenue, None)
            
        t_stats["children"] = []
        
        # Quarter values for trend
        t_stats["val_curr"] = rev_mapping.get(track.id, {}).get(q_current, 0.0)
        t_stats["val_prev"] = rev_mapping.get(track.id, {}).get(q_prev, 0.0)

        key = track.title.lower().strip() if track.title else "unknown"
        
        if key not in grouped_map:
            grouped_map[key] = {
                **t_stats,
                "children": [t_stats], 
                "isrc": str(1),
                "agg_val_curr": t_stats["val_curr"],
                "agg_val_prev": t_stats["val_prev"],
            }
        else:
            group = grouped_map[key]
            group["total_streams"] += t_stats["total_streams"]
            group["total_revenue"] += t_stats["total_revenue"]
            group["children"].append(t_stats)
            group["isrc"] = str(len(group["children"]))
            group["agg_val_curr"] += t_stats["val_curr"]
            group["agg_val_prev"] += t_stats["val_prev"]
            
    # Calculate Trend and Final list
    final_list = []
    for group in grouped_map.values():
        v_curr = group["agg_val_curr"]
        v_prev = group["agg_val_prev"]
        
        trend = 0.0
        if v_prev > 0:
            trend = ((v_curr - v_prev) / v_prev) * 100
        elif v_curr > 0 and q_prev:
            trend = None
            
        group["trend"] = trend
        
        # Only include if has data when filtering
        if (trimestre or platform) and group["total_streams"] == 0 and group["total_revenue"] == 0:
            continue
            
        final_list.append(group)

    # 5. Global Sorting
    def sort_key(x):
        val = x.get(sort_by, 0)
        if val is None: return -float('inf')
        return val

    is_desc = (sort_order == "desc")
    final_list.sort(key=sort_key, reverse=is_desc)
    
    return final_list[skip : skip + limit]

@router.get("/search", response_model=List[schemas.TrackStats])
def search_tracks(q: str, db: Session = Depends(get_db), current_user: models.Profile = Depends(get_current_user)):
    q = q.lower()
    
    # Optimized Search
    query = db.query(models.Track)\
        .options(joinedload(models.Track.artist))\
        .options(subqueryload(models.Track.splits))
    
    if current_user.is_admin != "admin":
        query = query.join(models.Split).filter(models.Split.participant_name == current_user.name)

    query = query.filter(
        (models.Track.title.ilike(f"%{q}%")) | 
        (models.Track.isrc.ilike(f"%{q}%")) |
        (models.Track.artist_name.ilike(f"%{q}%"))
    ).limit(50)
    
    results = query.all()
    unique_tracks = []
    
    for track in results:
        track_dict = _build_track_stats(track, track.cached_streams, track.cached_revenue, None)
        # Ensure 'title' key exists for frontend
        track_dict["title"] = track_dict.get("musica_display", track.title)
        unique_tracks.append(track_dict)

    return unique_tracks
@router.get("/isrcs", response_model=List[str])
def list_all_isrcs(db: Session = Depends(get_db)):
    results = db.query(models.Track.isrc).order_by(models.Track.isrc).all()
    return [r[0] for r in results if r[0]]

@router.post("/{isrc}/upload-master-audio")
async def upload_master_audio(isrc: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    track = db.query(models.Track).filter(models.Track.isrc == isrc).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
        
    content = await file.read()
    # Use ISRC and original extension for the filename in R2
    ext = os.path.splitext(file.filename)[1]
    filename = f"{isrc}{ext}"
    
    url = upload_to_r2(content, filename, file.content_type, folder="audio")
    if not url:
        raise HTTPException(status_code=500, detail="Failed to upload to R2")
        
    track.master_audio_url = url
    db.commit()

    # --- GOOGLE DRIVE MIRRORING ---
    try:
        # Extract metadata
        artist = track.artist_name or (track.artist.name if track.artist else "Desconhecido")
        
        # Extract year from release_date (e.g., "2023-10-27" or similar)
        year = "Sem Ano"
        if track.release_date:
            # Simple extraction: look for 4 consecutive digits
            import re
            year_match = re.search(r'\d{4}', track.release_date)
            if year_match:
                year = year_match.group(0)
        
        title = track.title or "Sem Titulo"
        
        # Call GDrive service
        drive_service = get_drive_service()
        drive_service.mirror_master_audio(
            content=content,
            filename=filename,
            mimetype=file.content_type,
            artist=artist,
            year=year,
            track_title=title
        )
    except Exception as drive_err:
        print(f"Non-blocking Google Drive Error: {drive_err}")
    # ------------------------------
        
    return {"url": url}

@router.post("/{isrc}/upload-master-cover")
async def upload_master_cover(isrc: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    track = db.query(models.Track).filter(models.Track.isrc == isrc).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
        
    content = await file.read()
    ext = os.path.splitext(file.filename)[1]
    filename = f"{isrc}{ext}"
    
    url = upload_to_r2(content, filename, file.content_type, folder="cover")
    if not url:
        raise HTTPException(status_code=500, detail="Failed to upload to R2")
        
    track.master_cover_url = url
    db.commit()
    return {"url": url}

@router.delete("/{isrc}/master-audio")
async def delete_master_audio(isrc: str, db: Session = Depends(get_db)):
    track = db.query(models.Track).filter(models.Track.isrc == isrc).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    if track.master_audio_url:
        # Extract filename from URL
        filename = track.master_audio_url.split("/")[-1]
        # Try to delete from R2
        delete_from_r2(filename, folder="audio")
        
        track.master_audio_url = None
        db.commit()
        
    return {"message": "Master audio deleted successfully"}

@router.delete("/{isrc}/master-cover")
async def delete_master_cover(isrc: str, db: Session = Depends(get_db)):
    track = db.query(models.Track).filter(models.Track.isrc == isrc).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    if track.master_cover_url:
        # Extract filename from URL
        filename = track.master_cover_url.split("/")[-1]
        # Try to delete from R2
        delete_from_r2(filename, folder="cover")
        
        track.master_cover_url = None
        db.commit()
        
    return {"message": "Master cover deleted successfully"}

@router.get("/{isrc}", response_model=schemas.TrackStats)
def get_track_by_isrc(isrc: str, db: Session = Depends(get_db), current_user: models.Profile = Depends(get_current_user)):
    track = db.query(models.Track).filter(models.Track.isrc == isrc).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
        
    if current_user.is_admin != "admin":
        # Check access
        has_split = db.query(models.Split).filter(models.Split.track_id == track.id, models.Split.participant_name == current_user.name).first()
        if not has_split:
             raise HTTPException(status_code=403, detail="Access denied")

    return _build_track_stats(track, track.cached_streams, track.cached_revenue, track.artist.name if track.artist else "Unknown")

@router.get("/{isrc}/export")
def export_track_ficha(isrc: str, format: str = "pdf", db: Session = Depends(get_db)):
    from ..services.export_service import generate_technical_sheet_pdf, export_to_google_docs
    from fastapi.responses import Response

    track = db.query(models.Track).filter(models.Track.isrc == isrc).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    track_data = _build_track_stats(track, 0, 0, track.artist_name)

    if format == "pdf":
        pdf_content = generate_technical_sheet_pdf(track_data)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Ficha_Tecnica_{isrc}.pdf"}
        )
    elif format == "gdoc":
        try:
            doc = export_to_google_docs(track_data)
            return {"id": doc['id'], "url": doc['webViewLink']}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")
