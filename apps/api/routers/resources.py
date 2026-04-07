from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..services.storage_service import get_storage_stats
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/resources", tags=["resources"])

class BankSchema(BaseModel):
    code: str
    name: str
    label: str

    class Config:
        orm_mode = True

DEFAULT_BANKS = [
    {"code": "001", "label": "Banco do Brasil", "name": "Banco do Brasil S.A."},
    {"code": "033", "label": "Santander", "name": "Banco Santander (Brasil) S.A."},
    {"code": "104", "label": "Caixa Econômica", "name": "Caixa Econômica Federal"},
    {"code": "237", "label": "Bradesco", "name": "Banco Bradesco S.A."},
    {"code": "341", "label": "Itaú", "name": "Itaú Unibanco S.A."},
    {"code": "260", "label": "NuBank", "name": "Nu Pagamentos S.A."},
    {"code": "077", "label": "Inter", "name": "Banco Inter S.A."},
    {"code": "212", "label": "Original", "name": "Banco Original S.A."},
    {"code": "655", "label": "Votorantim", "name": "Banco Votorantim S.A."},
    {"code": "422", "label": "Safra", "name": "Banco Safra S.A."},
    {"code": "290", "label": "PagBank", "name": "PagSeguro Internet S.A."},
    {"code": "323", "label": "Mercado Pago", "name": "Mercado Pago Instituição de Pagamento tomou"},
    {"code": "380", "label": "PicPay", "name": "PicPay Servicos S.A."},
]

@router.get("/banks", response_model=List[BankSchema])
def get_banks(db: Session = Depends(get_db)):
    banks = db.query(models.BankList).order_by(models.BankList.code).all()
    if not banks:
        # Seed default banks if empty
        for bank_data in DEFAULT_BANKS:
            # Filter out 'label' if not in model, assuming model is code/name
            data = {"code": bank_data["code"], "name": bank_data["name"]}
            db_bank = models.BankList(**data)
            db.add(db_bank)
        db.commit()
        banks = db.query(models.BankList).all()
    return banks

@router.get("/storage/stats")
def get_r2_stats():
    """Returns usage stats for all configured R2 accounts."""
    try:
        return get_storage_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching storage stats: {str(e)}")
