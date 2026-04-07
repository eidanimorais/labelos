import os
import csv
import sqlite3
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SQLITE_PATH = os.getenv("SQLITE_PATH", "yt_views.db")
EXPORT_DIR = os.getenv("EXPORT_DIR", "./exports")

def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)

def export_all():
    ensure_dir(EXPORT_DIR)
    date_str = datetime.now().strftime("%Y-%m-%d")
    out_path = os.path.join(EXPORT_DIR, f"youtube_views_{date_str}.csv")

    conn = sqlite3.connect(SQLITE_PATH)
    cur = conn.cursor()

    cur.execute("""
    SELECT
      dm.date,
      v.musica,
      v.artist,
      v.plataforma,
      v.url,
      dm.view_count,
      dm.like_count,
      dm.comment_count,
      dm.video_id,
      v.title,
      v.channel_title,
      dm.fetched_at
    FROM daily_metrics dm
    LEFT JOIN videos v ON v.video_id = dm.video_id
    ORDER BY dm.video_id, dm.date
    """)

    rows = cur.fetchall()
    headers = ["date", "musica", "artista", "plataforma", "url", "view_count", "like_count", "comment_count", "video_id", "youtube_title", "channel_title", "fetched_at"]

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    conn.close()
    print(f"CSV gerado: {out_path}")

if __name__ == "__main__":
    export_all()
