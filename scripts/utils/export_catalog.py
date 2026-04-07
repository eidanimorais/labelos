import sqlite3
import csv
import os

# Configuration
DB_PATH = "royalties.db"
OUTPUT_DIR = "uploads"
OUTPUT_FILE = "catalogo_export.csv"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, OUTPUT_FILE)

def export_catalog():
    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

    # Connect to database
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Query all data from tracks table
        query = "SELECT * FROM tracks"
        cursor.execute(query)
        
        # Get column names
        column_names = [description[0] for description in cursor.description]
        
        # Fetch all rows
        rows = cursor.fetchall()
        
        # Write to CSV
        with open(OUTPUT_PATH, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(column_names) # Header
            writer.writerows(rows)       # Data
            
        print(f"Successfully exported {len(rows)} rows to {OUTPUT_PATH}")
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    export_catalog()
