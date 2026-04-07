import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
import re

from ..utils import normalize_royalties, normalize_track_title, normalize_territory_name

def process_csv(file_path: str, filename: str, db: Session):
    # Read CSV with robust detection
    df = None
    last_error = None
    
    encodings_to_try = ['utf-8', 'latin-1', 'cp1252']
    separators_to_try = [',', ';', '\t']
    
    for encoding in encodings_to_try:
        if df is not None: break
        for sep in separators_to_try:
            try:
                # Try reading just the first line to check columns
                preview = pd.read_csv(file_path, sep=sep, encoding=encoding, nrows=2)
                
                # Normalize columns to uppercase for check
                preview.columns = preview.columns.str.upper().str.strip()
                
                # Check for critical columns
                if 'ISRC' in preview.columns or 'ISWC' in preview.columns or 'ROYALTIES' in preview.columns:
                     # Read full file
                    df = pd.read_csv(file_path, sep=sep, encoding=encoding)
                    break 
            except Exception as e:
                last_error = e
                continue
                
    if df is None:
        raise Exception(f"Não foi possível ler o arquivo. Verifique o formato. Erro: {str(last_error)}")
        
    # Standardize column names
    df.columns = df.columns.str.strip().str.upper()
    
    # Create Import record
    
    # Detect Distributor from Filename (Option 1)
    # Pattern: YEAR (DISTRIBUTOR) [LABEL].csv
    # Regex look for content inside first parenthesis
    distributor_detected = "Unknown"
    match = re.search(r'\((.*?)\)', filename)
    if match:
        distributor_detected = match.group(1).strip()
    
    db_import = models.Import(
        filename=filename, 
        distributor=distributor_detected,
        notes=f"Imported via upload. Detected Distributor: {distributor_detected}"
    )
    db.add(db_import)
    db.commit()
    db.refresh(db_import)

    transactions = []
    
    # Cache for Bulk Insert/Lookup
    # Tracks: {isrc: track_id}
    # Works: {iswc: work_id}
    
    # 1. Pre-fetch existing catalogues
    existing_tracks = {t.isrc: t for t in db.query(models.Track).all() if t.isrc}
    existing_works = {w.iswc: w for w in db.query(models.Work).all() if w.iswc}
    
    new_tracks_to_add = {} # isrc -> TrackModel
    new_works_to_add = {}  # iswc -> WorkModel
    
    # Process Rows to build Catalog Objects first
    for index, row in df.iterrows():
        isrc = str(row.get('ISRC', '')).strip()
        iswc = str(row.get('ISWC', '')).strip()
        
        # Clean placeholders
        if isrc in ['nan', 'None', '', '0']: isrc = None
        if iswc in ['nan', 'None', '', '0']: iswc = None
        
        # Track Logic (Prioritize ISRC)
        if isrc:
            if isrc not in existing_tracks and isrc not in new_tracks_to_add:
                 musica_raw = str(row.get('MÚSICA', row.get('TITLE', 'Unknown'))).strip()
                 artista_raw = str(row.get('ARTISTA', row.get('ARTIST', ''))).strip()
                 new_tracks_to_add[isrc] = models.Track(
                     isrc=isrc, 
                     title=musica_raw,
                     artist_name=artista_raw,
                     version="Original"
                 )
        
        # Work Logic (Prioritize ISWC)
        if iswc:
            if iswc not in existing_works and iswc not in new_works_to_add:
                title_raw = str(row.get('MÚSICA', row.get('TITLE', 'Unknown'))).strip()
                new_works_to_add[iswc] = models.Work(
                    iswc=iswc, 
                    title=title_raw
                )
                
    # Save New Catalog Items
    if new_tracks_to_add:
        db.bulk_save_objects(new_tracks_to_add.values())
        db.commit()
        # Refresh cache
        existing_tracks = {t.isrc: t for t in db.query(models.Track).all() if t.isrc}
        
    if new_works_to_add:
        db.bulk_save_objects(new_works_to_add.values())
        db.commit()
        existing_works = {w.iswc: w for w in db.query(models.Work).all() if w.iswc}
        
    # 2. Create Transactions with Links
    for index, row in df.iterrows():
        # Clean Amounts
        royalties = normalize_royalties(row.get('ROYALTIES', 0))
        streams = row.get('STREAMS', row.get('QUANTITY', 0))
        try:
            streams = int(float(str(streams).replace(".", "").replace(",", ".")))
        except:
            streams = 0
            
        # Keys
        isrc = str(row.get('ISRC', '')).strip()
        if isrc in ['nan', 'None', '', '0']: isrc = None
        
        iswc = str(row.get('ISWC', '')).strip()
        if iswc in ['nan', 'None', '', '0']: iswc = None
        
        # Links
        track_obj = existing_tracks.get(isrc) if isrc else None
        work_obj = existing_works.get(iswc) if iswc else None
        
        # Metadata
        musica_raw = str(row.get('MÚSICA', row.get('TITLE', ''))).strip()
        artista_raw = str(row.get('ARTISTA', row.get('ARTIST', ''))).strip()
        territorio = normalize_territory_name(row.get('TERRÍTORIO', row.get('COUNTRY', '')))
        source = row.get('PLATAFORMA', row.get('SOURCE', row.get('DSP', 'Unknown')))
        
        transaction = models.Transaction(
            import_id=db_import.id,
            
            # Foreign Keys
            track_id=track_obj.id if track_obj else None,
            work_id=work_obj.id if work_obj else None,
            
            # Data
            trimestre=row.get('TRIMESTRE', row.get('PERIOD', '')),
            source=source,
            territorio=territorio,
            streams=streams,
            royalties_value=royalties,
            
            # Snapshots
            raw_isrc=isrc,
            raw_iswc=iswc,
            raw_track=musica_raw,
            raw_artist=artista_raw
        )
        transactions.append(transaction)
        
    # Bulk Insert Transactions
    if transactions:
        db.bulk_save_objects(transactions)
        db.commit()
        
    # 3. Update Materialized Stats for Affected Tracks
    # This ensures 'cached_streams' and 'cached_revenue' are always up to date after import
    # Optimization: Only recalculate for tracks involved in this import
    
    affected_track_ids = {t.track_id for t in transactions if t.track_id is not None}
    
    if affected_track_ids:
        # Calculate new totals from scratch (safest way to ensure consistency)
        stats_query = db.query(
            models.Transaction.track_id,
            func.sum(models.Transaction.streams).label("total_streams"),
            func.sum(models.Transaction.royalties_value).label("total_revenue")
        ).filter(
            models.Transaction.track_id.in_(affected_track_ids)
        ).group_by(models.Transaction.track_id).all()
        
        # Update Tracks
        # Loading tracks to update
        tracks_to_update = db.query(models.Track).filter(models.Track.id.in_(affected_track_ids)).all()
        track_map = {t.id: t for t in tracks_to_update}
        
        for t_id, t_streams, t_revenue in stats_query:
            if t_id in track_map:
                track = track_map[t_id]
                track.cached_streams = t_streams or 0
                track.cached_revenue = t_revenue or 0.0
                
        db.commit()
        
    return db_import
