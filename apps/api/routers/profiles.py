from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from .. import models

router = APIRouter(
    prefix="/profiles",
    tags=["profiles"]
)

# Pydantic Schemas
class ProfileBase(BaseModel):
    name: str
    full_name: Optional[str] = None
    type: str = "artist"
    photo_url: Optional[str] = None
    
    # New Fields
    cpf: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    publisher: Optional[str] = None
    label_name: Optional[str] = None
    association: Optional[str] = None
    publisher_extra: Optional[str] = None
    
    bank: Optional[str] = None
    agency: Optional[str] = None
    account: Optional[str] = None
    pix: Optional[str] = None
    bio: Optional[str] = None
    spotify_url: Optional[str] = None
    apple_music_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    website_url: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    type: Optional[str] = None
    photo_url: Optional[str] = None
    
    cpf: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    publisher: Optional[str] = None
    label_name: Optional[str] = None
    association: Optional[str] = None
    publisher_extra: Optional[str] = None
    
    bank: Optional[str] = None
    agency: Optional[str] = None
    account: Optional[str] = None
    account: Optional[str] = None
    pix: Optional[str] = None
    bio: Optional[str] = None
    spotify_url: Optional[str] = None
    apple_music_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    website_url: Optional[str] = None

class Profile(ProfileBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# Endpoints
@router.get("/", response_model=List[Profile])
def list_profiles(search: str = "", type: str = "", db: Session = Depends(get_db)):
    query = db.query(models.Profile)
    
    if search:
        query = query.filter(models.Profile.name.ilike(f"%{search}%"))
        
    if type:
        query = query.filter(models.Profile.type == type)
        
    return query.all()

@router.get("/{id}", response_model=Profile)
def get_profile(id: int, db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(models.Profile.id == id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/", response_model=Profile)
def create_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    # Check duplicate name
    existing = db.query(models.Profile).filter(models.Profile.name.ilike(profile.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile with this name already exists")
        
    db_profile = models.Profile(**profile.dict())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.put("/{id}", response_model=Profile)
def update_profile(id: int, profile: ProfileUpdate, db: Session = Depends(get_db)):
    db_profile = db.query(models.Profile).filter(models.Profile.id == id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    if profile.name is not None:
        db_profile.name = profile.name
    if profile.full_name is not None:
        db_profile.full_name = profile.full_name
    if profile.type is not None:
        db_profile.type = profile.type
    if profile.photo_url is not None:
        db_profile.photo_url = profile.photo_url
    if profile.bank is not None:
        db_profile.bank = profile.bank
    if profile.agency is not None:
        db_profile.agency = profile.agency
    if profile.account is not None:
        db_profile.account = profile.account
    if profile.pix is not None:
        db_profile.pix = profile.pix
    if profile.bio is not None:
        db_profile.bio = profile.bio
    if profile.spotify_url is not None:
        db_profile.spotify_url = profile.spotify_url
    if profile.apple_music_url is not None:
        db_profile.apple_music_url = profile.apple_music_url
    if profile.instagram_url is not None:
        db_profile.instagram_url = profile.instagram_url
    if profile.youtube_url is not None:
        db_profile.youtube_url = profile.youtube_url
    if profile.website_url is not None:
        db_profile.website_url = profile.website_url
        
    # Updated Fields
    if profile.cpf is not None:
        db_profile.cpf = profile.cpf
    if profile.email is not None:
        db_profile.email = profile.email
    if profile.address is not None:
        db_profile.address = profile.address
    if profile.neighborhood is not None:
        db_profile.neighborhood = profile.neighborhood
    if profile.city is not None:
        db_profile.city = profile.city
    if profile.state is not None:
        db_profile.state = profile.state
    if profile.zip_code is not None:
        db_profile.zip_code = profile.zip_code
    if profile.publisher is not None:
        db_profile.publisher = profile.publisher
    if profile.label_name is not None:
        db_profile.label_name = profile.label_name
    if profile.association is not None:
        db_profile.association = profile.association
    if profile.publisher_extra is not None:
        db_profile.publisher_extra = profile.publisher_extra
        
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.delete("/{id}")
def delete_profile(id: int, db: Session = Depends(get_db)):
    db_profile = db.query(models.Profile).filter(models.Profile.id == id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    db.delete(db_profile)
    db.commit()
    return {"ok": True}

from fastapi import UploadFile, File
from pypdf import PdfReader
import io
import re

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    content = await file.read()
    pdf_file = io.BytesIO(content)
    
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        # Regex patterns to find info
        # Adjust patterns based on expected PDF format
        data = {}
        
        # Name
        # Look for "Nome:" or "Beneficiário:"
        name_match = re.search(r"(?:Nome|Beneficiário)[:\s]+(.+)", text, re.IGNORECASE)
        if name_match:
            data["full_name"] = name_match.group(1).strip()
            # Also try to infer display name (first 2 names)
            parts = data["full_name"].split()
            if len(parts) >= 1:
                data["name"] = " ".join(parts[:2])
        
        # Bank
        # Look for "Banco:" or "Instituição:"
        bank_match = re.search(r"(?:Banco|Instituição)[:\s]+(.+)", text, re.IGNORECASE)
        if bank_match:
            data["bank"] = bank_match.group(1).strip()
            
        # Agency
        # Look for "Agência:"
        agency_match = re.search(r"Agência[:\s]+([\d\-]+)", text, re.IGNORECASE)
        if agency_match:
            data["agency"] = agency_match.group(1).strip()
            
        # Account
        # Look for "Conta:" or "Conta Corrente:"
        account_match = re.search(r"Conta(?: Corrente)?[:\s]+([\d\-]+)", text, re.IGNORECASE)
        if account_match:
            data["account"] = account_match.group(1).strip()
            
        # Pix (often CPF or Email)
        # Look for "Chave Pix:" or just extract CPF pattern
        pix_match = re.search(r"Chave Pix[:\s]+(.+)", text, re.IGNORECASE)
        if pix_match:
            data["pix"] = pix_match.group(1).strip()
        else:
            # Fallback: find CPF
            cpf_match = re.search(r"\d{3}\.\d{3}\.\d{3}-\d{2}", text)
            if cpf_match:
                data["pix"] = cpf_match.group(0)
                
        return data
        
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

# Image Upload
from PIL import Image
import os

# Determine absolute path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "media", "profiles")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def process_profile_image(file_content: bytes, save_path: str):
    try:
        img = Image.open(io.BytesIO(file_content))
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Resize to max 800x800, maintaining aspect ratio (thumbnail does this)
        # But for profiles, maybe a square crop is better? 
        # For now, let's just limit size to avoid huge files. Frontend can crop via CSS.
        max_size = (800, 800)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        img.save(save_path, "WEBP", quality=85)
        return True
    except Exception as e:
        print(f"Error processing profile image: {e}")
        return False

@router.post("/{id}/photo", response_model=Profile)
async def upload_profile_photo(id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_profile = db.query(models.Profile).filter(models.Profile.id == id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    # Validate extension (optional, PIL handles most, but good practice)
    # content_type = file.content_type
    
    try:
        content = await file.read()
        
        # Generate filename: profile_{id}_{timestamp}.webp to avoid cache issues?
        # Or just {id}.webp to keep it simple and overwrite. 
        # Browser caching might be an issue if we overwrite, so let's use simple ID for now 
        # and rely on frontend cache busting or just simple overwrite.
        filename = f"{id}.webp"
        save_path = os.path.join(UPLOAD_DIR, filename)
        
        if process_profile_image(content, save_path):
            # Update DB URL
            # Url path: http://localhost:8000/static/media/profiles/1.webp
            url = f"http://localhost:8000/static/media/profiles/{filename}"
            db_profile.photo_url = url
            db.commit()
            db.refresh(db_profile)
            return db_profile
        else:
            raise HTTPException(status_code=500, detail="Failed to process image")
            
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal Server Error during upload")
