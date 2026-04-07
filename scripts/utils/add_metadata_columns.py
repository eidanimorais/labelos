import sqlite3

def add_columns():
    conn = sqlite3.connect('royalties.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE tracks ADD COLUMN version_type VARCHAR")
        print("Added version_type column")
    except Exception as e:
        print(f"Error adding version_type: {e}")

    try:
        cursor.execute("ALTER TABLE tracks ADD COLUMN production_cost FLOAT DEFAULT 0")
        print("Added production_cost column")
    except Exception as e:
        print(f"Error adding production_cost: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_columns()
