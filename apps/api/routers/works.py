from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/works",
    tags=["works"]
)

@router.get("/", response_model=List[schemas.Work])
def list_works(db: Session = Depends(get_db)):
    return db.query(models.Work).all()

@router.get("/{work_id}", response_model=schemas.Work)
def get_work(work_id: int, db: Session = Depends(get_db)):
    work = db.query(models.Work).filter(models.Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return work

@router.post("/", response_model=schemas.Work)
def create_work(work: schemas.WorkCreate, db: Session = Depends(get_db)):
    db_work = models.Work(**work.dict())
    db.add(db_work)
    db.commit()
    db.refresh(db_work)
    return db_work
