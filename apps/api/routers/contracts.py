
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import json
from datetime import datetime

from .. import models, database, schemas
from ..services.assinafy_service import assinafy_service

router = APIRouter(
    prefix="/contracts",
    tags=["contracts"]
)

# Directory to store uploaded contracts
UPLOAD_DIR = "static/contracts"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_contract(
    title: str = Form(...),
    signers: str = Form(...), # JSON string of signers
    track_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    try:
        # 1. Parse signers
        try:
            signers_list = json.loads(signers)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid signers JSON")

        # 2. Save file locally
        file_location = f"{UPLOAD_DIR}/{datetime.now().timestamp()}_{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        # 3. Upload to Assinafy
        assinafy_data = assinafy_service.create_document(file_location, signers_list)
        assinafy_id = assinafy_data.get("id")
        
        # 4. Save to DB
        new_contract = models.Contract(
            title=title,
            file_path=file_location,
            track_id=track_id,
            assinafy_id=assinafy_id,
            status="Enviado", # Assuming success means it's uploaded/sent
            signers_info=signers
        )
        
        db.add(new_contract)
        db.commit()
        db.refresh(new_contract)
        
        return new_contract

    except Exception as e:
        print(f"Error processing contract: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[dict]) # specific schema todo
def list_contracts(db: Session = Depends(database.get_db)):
    contracts = db.query(models.Contract).all()
    return contracts

@router.post("/{contract_id}/sync")
def sync_contract(contract_id: int, db: Session = Depends(database.get_db)):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    if not contract.assinafy_id:
        raise HTTPException(status_code=400, detail="No Assinafy ID linked")
        
    try:
        # Get status from Assinafy
        # In a real scenario, we would map the Assinafy status to our local status enum
        doc_data = assinafy_service.get_document(contract.assinafy_id)
        current_status = doc_data.get("status", contract.status)
        
        contract.status = current_status
        contract.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(contract)
        return contract
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
