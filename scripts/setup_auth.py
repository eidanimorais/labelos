from backend.database import SessionLocal
from backend import models, auth_utils

def init_users():
    db = SessionLocal()
    
    # 1. Create/Update Admin
    admin_name = "admin"
    admin = db.query(models.Profile).filter(models.Profile.name == admin_name).first()
    if not admin:
        admin = models.Profile(
            name=admin_name,
            full_name="Administrator",
            type="admin",
            is_admin="admin",
            hashed_password=auth_utils.get_password_hash("@Mariana1998")
        )
        db.add(admin)
        print(f"Created admin user: {admin_name}")
    else:
        admin.is_admin = "admin"
        admin.hashed_password = auth_utils.get_password_hash("@Mariana1998")
        print(f"Updated admin user: {admin_name}")

    # 2. Create/Update fuub (example artist)
    artist_name = "fuub"
    artist = db.query(models.Profile).filter(models.Profile.name == artist_name).first()
    if not artist:
        artist = models.Profile(
            name=artist_name,
            full_name="Fuub Artist",
            type="artist",
            is_admin="artist",
            hashed_password=auth_utils.get_password_hash("fuub123")
        )
        db.add(artist)
        print(f"Created artist user: {artist_name}")
    else:
        artist.is_admin = "artist"
        artist.hashed_password = auth_utils.get_password_hash("fuub123")
        print(f"Updated artist user: {artist_name}")

    db.commit()
    db.close()

if __name__ == "__main__":
    init_users()
