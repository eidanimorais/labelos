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
    if s.startswith("http"):
        p = urlparse(s)
        parts = [x for x in p.path.split("/") if x]
        if len(parts) >= 2 and parts[0] == "channel":
            return parts[1]
        if len(parts) >= 1 and parts[0].startswith("@"):
            s = parts[0]
        else:
            raise ValueError("URL não reconhecida. Use /channel/UC... ou /@handle")

    if s.startswith("@"):
        data = yt_get(
            "https://www.googleapis.com/youtube/v3/channels",
            {"part": "id", "forHandle": s[1:], "key": API_KEY}
        )
        items = data.get("items", [])
        if not items:
            raise RuntimeError(f"Não encontrei canal para handle {s}")
        return items[0]["id"]

    if s.startswith("UC") and len(s) >= 20:
        return s

    raise ValueError("Passe um channel_id (UC...) ou um handle (@...) ou uma URL.")

def list_playlists(channel_id: str):
    url = "https://www.googleapis.com/youtube/v3/playlists"
    page_token = None
    while True:
        params = {
            "part": "snippet,contentDetails",
            "channelId": channel_id,
            "maxResults": 50,
            "key": API_KEY,
        }
        if page_token:
            params["pageToken"] = page_token

        data = yt_get(url, params)
        for item in data.get("items", []):
            yield {
                "playlist_id": item["id"],
                "title": item["snippet"]["title"],
            }

        page_token = data.get("nextPageToken")
        if not page_token:
            break

def list_playlist_items(playlist_id: str):
    url = "https://www.googleapis.com/youtube/v3/playlistItems"
    page_token = None
    while True:
        params = {
            "part": "snippet,contentDetails",
            "playlistId": playlist_id,
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
                "url": f"https://www.youtube.com/watch?v={cd.get('videoId')}"
            }

        page_token = data.get("nextPageToken")
        if not page_token:
            break

def main():
    import sys
    if not API_KEY:
        raise RuntimeError("Coloque YOUTUBE_API_KEY no seu .env")

    if len(sys.argv) < 2:
        print("Uso: python list_channel_releases.py <@handle|channel_id|url> [output.csv]")
        raise SystemExit(2)

    channel_or_handle = sys.argv[1]
    out_csv = sys.argv[2] if len(sys.argv) >= 3 else "channel_releases.csv"

    channel_id = resolve_channel_id(channel_or_handle)
    
    print(f"Listando álbuns/singles do canal: {channel_id}...")
    playlists = list(list_playlists(channel_id))
    print(f"Encontrados {len(playlists)} lançamentos (playlists).")

    all_videos = []
    seen_ids = set()

    for pl in playlists:
        print(f"Lendo playlist: {pl['title']}...")
        for item in list_playlist_items(pl['playlist_id']):
            if item['video_id'] not in seen_ids:
                all_videos.append({
                    "video_id": item["video_id"],
                    "title": item["title"],
                    "url": item["url"],
                    "release_name": pl["title"]
                })
                seen_ids.add(item['video_id'])

    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["video_id", "title", "url", "release_name"])
        w.writeheader()
        w.writerows(all_videos)

    print(f"OK: {len(all_videos)} músicas únicas exportadas para {out_csv}")

if __name__ == "__main__":
    main()
