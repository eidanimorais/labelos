from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
from ..database import get_db
from .. import schemas, models
from ..services import import_service

router = APIRouter(prefix="/imports", tags=["imports"])

@router.post("/sync")
def sync_folder(db: Session = Depends(get_db)):
    # Go up from apps/api/routers/imports.py to root
    # apps/api/routers/imports.py -> apps/api/routers -> apps/api -> apps -> root
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    extratos_dir = os.path.join(root_dir, "data", "extracts")
    
    if not os.path.exists(extratos_dir):
        os.makedirs(extratos_dir)
        return {"message": "Pasta 'data/extracts' criada. Adicione seus CSVs lá."}
    
    files = [f for f in os.listdir(extratos_dir) if f.lower().endswith('.csv')]
    
    processed_count = 0
    errors = []
    
    # Get existing filenames to avoid duplicates
    existing_imports = {i.filename for i in db.query(models.Import.filename).all()}
    
    for filename in files:
        if filename in existing_imports:
            continue
            
        file_path = os.path.join(extratos_dir, filename)
        try:
            import_service.process_csv(file_path, filename, db)
            processed_count += 1
        except Exception as e:
            errors.append(f"{filename}: {str(e)}")
            
    return {
        "message": f"Sincronização concluída. {processed_count} novos arquivos importados.",
        "errors": errors,
        "total_files_found": len(files)
    }

@router.delete("/all")
def delete_all_imports(db: Session = Depends(get_db)):
    db.query(models.Transaction).delete()
    db.query(models.Import).delete()
    
    # Reset Cache on Tracks
    db.query(models.Track).update({
        models.Track.cached_streams: 0,
        models.Track.cached_revenue: 0.0
    })
    
    db.commit()
    return {"message": "Todos os arquivos e dados foram removidos com sucesso."}

@router.delete("/{import_id}")
def delete_import(import_id: int, db: Session = Depends(get_db)):
    # Find import
    db_import = db.query(models.Import).filter(models.Import.id == import_id).first()
    if not db_import:
        raise HTTPException(status_code=404, detail="Importação não encontrada")
    
    # Get affected tracks before deleting transactions
    affected_track_ids = [t.track_id for t in db.query(models.Transaction.track_id).filter(models.Transaction.import_id == import_id).distinct()]
    
    # Cascade delete transactions
    db.query(models.Transaction).filter(models.Transaction.import_id == import_id).delete()
    
    # Delete the import record
    db.delete(db_import)
    
    # Recalculate Cache for Affected Tracks
    if affected_track_ids:
        from sqlalchemy import func
        
        # 1. Reset affected tracks to 0 first (in case they have no transactions left)
        # Check carefully: If we just sum, and there are no transactions, sum returns None.
        # So we can't just update to sum. We need to handle the "no transactions left" case.
        
        # Option A: Recalculate all (Heavy)
        # Option B: Recalculate specific (Optimized)
        
        for t_id in affected_track_ids:
            if not t_id: continue
            
            stats = db.query(
                func.sum(models.Transaction.streams),
                func.sum(models.Transaction.royalties_value)
            ).filter(models.Transaction.track_id == t_id).first()
            
            new_streams = stats[0] or 0
            new_revenue = stats[1] or 0.0
            
            db.query(models.Track).filter(models.Track.id == t_id).update({
                models.Track.cached_streams: new_streams,
                models.Track.cached_revenue: new_revenue
            })

    db.commit()
    return {"message": "Importação removida e valores recalculados com sucesso"}

@router.post("/upload", response_model=schemas.Import)
def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Deprecated but kept for compatibility or fallback, saving to 'uploaded_files'
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    upload_dir = os.path.join(root_dir, "data", "extracts") 
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        import_record = import_service.process_csv(file_path, file.filename, db)
        return import_record
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[schemas.Import])
def list_imports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    imports = db.query(models.Import).offset(skip).limit(limit).all()
    return imports
