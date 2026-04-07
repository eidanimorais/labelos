import sqlite3

db_path = "/Users/daniel/Documents/programacao/royalties/database/royalties.db"
q = "o mar"

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Simulating ilike with LOWER() and LIKE
query = """
SELECT id, isrc, title, artist_name FROM tracks
WHERE 
    LOWER(title) LIKE ? OR 
    LOWER(isrc) LIKE ? OR 
    LOWER(artist_name) LIKE ?
LIMIT 50
"""
search_param = f"%{q.lower()}%"
cur.execute(query, (search_param, search_param, search_param))
rows = cur.fetchall()

print(f"Encontrados {len(rows)} resultados para '{q}':")
for row in rows:
    print(dict(row))

conn.close()
