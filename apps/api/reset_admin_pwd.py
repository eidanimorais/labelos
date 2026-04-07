from passlib.context import CryptContext
import sqlite3
import os

db_path = "/Users/daniel/Documents/programacao/royalties/database/royalties.db"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_admin_password():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    new_hash = pwd_context.hash("admin")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("UPDATE profiles SET hashed_password = ? WHERE name = 'admin'", (new_hash,))
    conn.commit()
    conn.close()
    print("Admin password reset to 'admin'.")

if __name__ == "__main__":
    reset_admin_password()
