import os
import csv
import requests
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("YOUTUBE_API_KEY")

def yt_get(url, params):
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def resolve_channel_id(channel_or_handle: str) -> str:
    s = channel_or_handle.strip()

    # Se vier URL completa, tenta extrair
    if s.startswith("http"):
        p = urlparse(s)
        parts = [x for x in p.path.split("/") if x]
        # /channel/UC...
        if len(parts) >= 2 and parts[0] == "channel":
            return parts[1]
        # /@handle
        if len(parts) >= 1 and parts[0].startswith("@"):
            s = parts[0]
        else:
            raise ValueError("URL não reconhecida. Use /channel/UC... ou /@handle")

    # Handle: @algo
    if s.startswith("@"):
        data = yt_get(
            "https://www.googleapis.com/youtube/v3/channels",
            {"part": "id", "forHandle": s[1:], "key": API_KEY}
        )
        items = data.get("items", [])
        if not items:
            raise RuntimeError(f"Não encontrei canal para handle {s}")
        return items[0]["id"]

    # Channel ID direto
    if s.startswith("UC") and len(s) >= 20:
        return s

    raise ValueError("Passe um channel_id (UC...) ou um handle (@...) ou uma URL /channel/.. /@..")

def get_uploads_playlist_id(channel_id: str) -> str:
    data = yt_get(
        "https://www.googleapis.com/youtube/v3/channels",
        {"part": "contentDetails", "id": channel_id, "key": API_KEY}
    )
    items = data.get("items", [])
    if not items:
        raise RuntimeError("Canal não encontrado pelo ID")
    return items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

def list_all_videos_from_uploads(uploads_playlist_id: str):
    url = "https://www.googleapis.com/youtube/v3/playlistItems"
    page_token = None

    while True:
        params = {
            "part": "snippet,contentDetails",
            "playlistId": uploads_playlist_id,
            "maxResults": 50,
            "key": API_KEY,
        }
        if page_token:
            params["pageToken"] = page_token

        data = yt_get(url, params)
        for item in data.get("items", []):
            snip = item.get("snippet", {})
            cd = item.get("contentDetails", {})
            yield {
                "video_id": cd.get("videoId"),
                "title": snip.get("title"),
                "published_at": cd.get("videoPublishedAt") or snip.get("publishedAt"),
                "channel_title": snip.get("channelTitle"),
            }

        page_token = data.get("nextPageToken")
        if not page_token:
            break

def main():
    import sys
    if not API_KEY:
        raise RuntimeError("Coloque YOUTUBE_API_KEY no seu .env")

    if len(sys.argv) < 2:
        print("Uso: python list_channel_videos.py <@handle|channel_id|url> [output.csv]")
        raise SystemExit(2)

    channel_or_handle = sys.argv[1]
    out_csv = sys.argv[2] if len(sys.argv) >= 3 else "channel_videos.csv"

    channel_id = resolve_channel_id(channel_or_handle)
    uploads_id = get_uploads_playlist_id(channel_id)

    rows = list(list_all_videos_from_uploads(uploads_id))

    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["video_id", "title", "published_at", "channel_title"])
        w.writeheader()
        w.writerows(rows)

    print(f"OK: {len(rows)} vídeos exportados para {out_csv}")

if __name__ == "__main__":
    main()
