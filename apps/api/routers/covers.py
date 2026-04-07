from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from ..database import get_db
from ..models import Track
import os
import shutil
from PIL import Image
from slugify import slugify
import io

router = APIRouter(prefix="/covers", tags=["covers"])

# Determine absolute path for storage
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "media", "covers")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def process_image(file_content: bytes, save_path: str):
    """
    Resize to max 800x800 and save as WebP
    """
    try:
        img = Image.open(io.BytesIO(file_content))
        
        # Convert to RGB if necessary (e.g. from RGBA or CMYK)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        # Resize if larger than 800x800
        max_size = (800, 800)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save compressed
        img.save(save_path, "WEBP", quality=80)
        return True
    except Exception as e:
        print(f"Error processing image: {e}")
        return False

@router.post("/upload-bulk")
async def upload_bulk_covers(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    results = {
        "processed": 0,
        "matched": 0,
        "failed": 0,
        "details": []
    }
    
    # Pre-fetch all tracks to memory to avoid N+1 queries if list isn't huge
    # Or query one by one if optimization is needed later. For 50 files, one by one is fine.
    # But let's build a lookup dict for cleaner matching
    all_tracks = db.query(Track).all()
    
    # Create lookups
    isrc_map = {t.isrc: t for t in all_tracks if t.isrc}
    slug_map = {}
    for t in all_tracks:
        if t.musica_display:
            s = slugify(t.musica_display)
            slug_map[s] = t
        elif t.musica_normalizada:
             s = slugify(t.musica_normalizada)
             slug_map[s] = t

    for file in files:
        try:
            filename = file.filename
            name_part = os.path.splitext(filename)[0] # e.g. "BR12345" or "nao-me-entrego"
            
            # 1. Try Match by ISRC (Case insensitive)
            track = isrc_map.get(name_part.upper())
            
            # 2. Try Match by Title Slug
            if not track:
                slug_name = slugify(name_part)
                track = slug_map.get(slug_name)
            
            if track:
                # Process Image
                content = await file.read()
                save_filename = f"{track.isrc}.webp"
                save_path = os.path.join(UPLOAD_DIR, save_filename)
                
                success = process_image(content, save_path)
                
                if success:
                    # Update DB
                    # Use absolute path
                    track.cover_url = f"http://localhost:8000/static/media/covers/{save_filename}"
                    results["matched"] += 1
                    results["details"].append(f"Matched '{filename}' to {track.musica_display} ({track.isrc})")
                else:
                    results["failed"] += 1
                    results["details"].append(f"Failed to process image '{filename}'")
            else:
                results["failed"] += 1
                results["details"].append(f"No match found for '{filename}'")
                
            results["processed"] += 1
            
        except Exception as e:
            print(f"Error handling file {file.filename}: {e}")
            results["failed"] += 1
            results["details"].append(f"Error on file '{filename}': {str(e)}")

    db.commit()
    return results
