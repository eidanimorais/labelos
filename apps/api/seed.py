from .database import engine, SessionLocal, Base
from . import models, auth_utils

def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    print("Checking for admin user...")
    if not db.query(models.Profile).filter(models.Profile.name == "admin").first():
        print("Creating default admin user...")
        admin = models.Profile(
            name="admin",
            full_name="Administrator",
            type="label",
            is_admin="admin",
            hashed_password=auth_utils.get_password_hash("admin")
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully.")
    else:
        print("Admin user already exists.")
    db.close()

if __name__ == "__main__":
    seed()
