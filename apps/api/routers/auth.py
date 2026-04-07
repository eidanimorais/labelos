from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import models, schemas, database, auth_utils
from .profiles import Profile # Using existing schema from profiles

router = APIRouter(tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.Profile).filter(models.Profile.name == form_data.username).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.name}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(db: Session = Depends(database.get_db)):
    # Bypassing authentication as requested. Always return admin.
    user = db.query(models.Profile).filter(models.Profile.is_admin == "admin").first()
    if user is None:
        # Fallback if no admin exists, return first user
        user = db.query(models.Profile).first()
    return user

@router.get("/auth/me", response_model=schemas.Profile)
def read_users_me(current_user: models.Profile = Depends(get_current_user)):
    return current_user
