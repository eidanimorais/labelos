import os
import re
import csv
import sqlite3
from datetime import datetime, timezone
import requests
from dotenv import load_dotenv

# Carrega variaveis de ambiente
load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
SQLITE_PATH = os.getenv("SQLITE_PATH", "yt_views.db")
VIDEOS_CSV_PATH = "videos.csv"

# Regex para limpar ID se necessario
VIDEO_ID_RE = re.compile(r"(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})")

def extract_video_id(url_or_id: str) -> str:
    s = url_or_id.strip()
    m = VIDEO_ID_RE.search(s)
    if m:
        return m.group(1)
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", s):
        return s
    raise ValueError(f"Não consegui extrair o video_id de: {url_or_id}")

def init_db(conn: sqlite3.Connection) -> None:
    conn.execute("""
    CREATE TABLE IF NOT EXISTS videos (
        video_id TEXT PRIMARY KEY,
        title TEXT,
        channel_title TEXT,
        artist TEXT,
        musica TEXT,
        plataforma TEXT,
        url TEXT,
        created_at TEXT NOT NULL
    )
    """)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS daily_metrics (
        date TEXT NOT NULL,
        video_id TEXT NOT NULL,
        view_count INTEGER NOT NULL,
        like_count INTEGER,
        comment_count INTEGER,
        fetched_at TEXT NOT NULL,
        PRIMARY KEY (date, video_id),
        FOREIGN KEY (video_id) REFERENCES videos(video_id)
    )
    """)
    # Migracao simples se colunas novas nao existirem
    try:
        conn.execute("ALTER TABLE videos ADD COLUMN artist TEXT")
    except: pass
    try:
        conn.execute("ALTER TABLE videos ADD COLUMN musica TEXT")
    except: pass
    try:
        conn.execute("ALTER TABLE videos ADD COLUMN plataforma TEXT")
    except: pass
    try:
        conn.execute("ALTER TABLE videos ADD COLUMN url TEXT")
    except: pass
    
    conn.commit()

def fetch_video_stats(video_id: str) -> dict:
    if not YOUTUBE_API_KEY:
        raise RuntimeError("Faltou YOUTUBE_API_KEY no .env")

    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {"id": video_id, "part": "snippet,statistics", "key": YOUTUBE_API_KEY}
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()

    items = data.get("items", [])
    if not items:
        print(f"AVISO: Vídeo não encontrado na API: {video_id}")
        return None

    item = items[0]
    snippet = item.get("snippet", {})
    stats = item.get("statistics", {})

    def to_int(x):
        if x is None:
            return None
        try:
            return int(x)
        except:
            return None

    return {
        "video_id": video_id,
        "title": snippet.get("title"),
        "channel_title": snippet.get("channelTitle"),
        "view_count": to_int(stats.get("viewCount")) or 0,
        "like_count": to_int(stats.get("likeCount")),
        "comment_count": to_int(stats.get("commentCount")),
    }

def upsert(conn: sqlite3.Connection, payload: dict, metadata: dict) -> None:
    utc_now = datetime.now(timezone.utc)
    date_utc = utc_now.strftime("%Y-%m-%d")
    fetched_at = utc_now.isoformat()

    conn.execute("""
    INSERT INTO videos (video_id, title, channel_title, artist, musica, plataforma, url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(video_id) DO UPDATE SET
        title=excluded.title,
        channel_title=excluded.channel_title,
        artist=excluded.artist,
        musica=excluded.musica,
        plataforma=excluded.plataforma,
        url=excluded.url
    """, (
        payload["video_id"], 
        payload["title"], 
        payload["channel_title"], 
        metadata.get("artista"),
        metadata.get("musica"),
        metadata.get("plataforma"),
        metadata.get("url"),
        fetched_at
    ))

    conn.execute("""
    INSERT INTO daily_metrics (date, video_id, view_count, like_count, comment_count, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(date, video_id) DO UPDATE SET
        view_count=excluded.view_count,
        like_count=excluded.like_count,
        comment_count=excluded.comment_count,
        fetched_at=excluded.fetched_at
    """, (
        date_utc,
        payload["video_id"],
        payload["view_count"],
        payload["like_count"],
        payload["comment_count"],
        fetched_at
    ))

    conn.commit()

def load_videos_from_csv(path: str) -> list:
    videos = []
    if not os.path.exists(path):
        print(f"Arquivo CSV não encontrado: {path}")
        return []
        
    with open(path, mode='r', encoding='utf-8') as f:
        content = f.read(1024)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(content, delimiters=',;')
            reader = csv.DictReader(f, dialect=dialect)
        except Exception:
            reader = csv.DictReader(f)
            
        for row in reader:
            row = {k.strip().lower() if k else k: v for k, v in row.items()}
            
            # Map headers safely
            url_input = row.get('url') or row.get('link') or row.get('video_id')
            if url_input and url_input.strip():
                try:
                    video_id = extract_video_id(url_input)
                    videos.append({
                        "id": video_id,
                        "artista": row.get('artista', ''),
                        "musica": row.get('música', '') or row.get('musica', ''),
                        "plataforma": row.get('plataforma', ''),
                        "url": url_input
                    })
                except Exception as e:
                    print(f"Aviso ao processar '{url_input}': {e}")
    return videos

def main():
    conn = sqlite3.connect(SQLITE_PATH)
    init_db(conn)

    # Cleanup Rick Astley if exists
    conn.execute("DELETE FROM daily_metrics WHERE video_id = 'dQw4w9WgXcQ'")
    conn.execute("DELETE FROM videos WHERE video_id = 'dQw4w9WgXcQ'")
    conn.commit()

    print(f"Lendo vídeos de: {VIDEOS_CSV_PATH}")
    videos_list = load_videos_from_csv(VIDEOS_CSV_PATH)
    
    if not videos_list:
        print("Nenhum vídeo para processar.")
        conn.close()
        return

    print(f"Processando {len(videos_list)} vídeos...")
    
    success_count = 0
    
    for v in videos_list:
        vid = v["id"]
        try:
            payload = fetch_video_stats(vid)
            if payload:
                upsert(conn, payload, metadata=v)
                print(f"OK {vid} | {payload['title'][:30]}... | Views: {payload['view_count']}")
                success_count += 1
        except Exception as e:
            print(f"ERRO ao processar {vid}: {e}")

    conn.close()
    print(f"Concluído: {success_count}/{len(videos_list)} vídeos atualizados.")

if __name__ == "__main__":
    main()
