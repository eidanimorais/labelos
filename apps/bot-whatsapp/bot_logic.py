import os
import re
import json
import sqlite3
import tempfile
import requests
from datetime import datetime
from typing import Optional, Dict, Any

import boto3
from botocore.config import Config
from dateutil import parser as dateparser
from dotenv import load_dotenv

load_dotenv()

# =========================
# CONFIG
# =========================
MAIN_DB_PATH = os.environ.get("MAIN_DB_PATH", "../../data/db/royalties.db")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

# R2 Config
R2_ACTIVE_VERSION = os.getenv("R2_ACTIVE_VERSION", "V3")

def get_r2_client(version="V3"):
    prefix = version
    acc_id = os.getenv(f"R2_{prefix}_ACCOUNT_ID")
    key_id = os.getenv(f"R2_{prefix}_ACCESS_KEY_ID")
    secret = os.getenv(f"R2_{prefix}_SECRET_ACCESS_KEY")
    
    if not all([acc_id, key_id, secret]):
        return None, None, None
        
    endpoint_url = f"https://{acc_id}.r2.cloudflarestorage.com"
    client = boto3.client(
        service_name="s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=key_id,
        aws_secret_access_key=secret,
        region_name="auto",
        config=Config(s3={"addressing_style": "virtual"})
    )
    bucket = os.getenv(f"R2_{prefix}_BUCKET_NAME")
    domain = os.getenv(f"R2_{prefix}_PUBLIC_DOMAIN")
    return client, bucket, domain

# =========================
# UPLOAD R2
# =========================
def upload_content_to_r2(content: bytes, filename: str, folder: str) -> Optional[str]:
    try:
        # Define qual conta R2 usar
        version = R2_ACTIVE_VERSION
        if filename.lower().endswith(".mp3"):
            version = "V5"
            
        client, bucket, domain = get_r2_client(version)
        if not client:
            return None
            
        key = f"{folder}/{filename}"
        low_file = filename.lower()
        if low_file.endswith(".mp3"):
            content_type = "audio/mpeg"
        elif low_file.endswith(".wav"):
            content_type = "audio/wav"
        elif low_file.endswith((".jpg", ".jpeg")):
            content_type = "image/jpeg"
        else:
            content_type = "application/octet-stream"
        
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=content,
            ContentType=content_type
        )
        
        if domain:
            if not domain.startswith("http"):
                domain = f"https://{domain}"
            return f"{domain}/{key}"
        return None
    except Exception as e:
        print(f"Erro no upload para R2: {e}")
        return None

# =========================
# PERSISTENCE
# =========================
def persist_release(payload: Dict[str, Any], cover_bytes: bytes = None, audio_bytes: bytes = None, audio_ext: str = "wav"):
    """
    Persiste os dados no banco principal e faz upload dos arquivos se fornecidos.
    """
    cover_url = None
    audio_url = None
    
    if cover_bytes:
        filename = f"cover_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        cover_url = upload_content_to_r2(cover_bytes, filename, "covers")
        
    if audio_bytes:
        filename = f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{audio_ext}"
        audio_url = upload_content_to_r2(audio_bytes, filename, "audio")

    # 2. Conecta ao banco principal
    db_abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), MAIN_DB_PATH))
    con = sqlite3.connect(db_abs_path)
    cur = con.cursor()
    
    # 3. Tenta encontrar o artista no sistema
    artist_name_input = payload["artist"]
    cur.execute("SELECT id, name FROM profiles WHERE name LIKE ? LIMIT 1", (f"%{artist_name_input}%",))
    profile = cur.fetchone()
    
    artist_id = None
    final_artist_name = artist_name_input
    
    if profile:
        artist_id = profile[0]
        final_artist_name = profile[1]
        
    # 4. Define o ISRC (Usa o fornecido ou gera um temporário)
    isrc_to_save = payload.get("isrc")
    if not isrc_to_save:
        isrc_to_save = f"BOT-{datetime.now().strftime('%Y%H%M%S')}"

    # 5. Insere na tabela de tracks do sistema
    cur.execute(
        """INSERT INTO tracks (title, artist_name, artist_id, release_date, cover_url, master_audio_url, isrc)
           VALUES (?,?,?,?,?,?,?)""",
        (
            payload["track"],
            final_artist_name,
            artist_id,
            payload["date"],
            cover_url,
            audio_url,
            isrc_to_save
        ),
    )
    track_id = cur.lastrowid

    # 6. Se tivermos o artist_id, cria um split de 100% (Torna a faixa "Live")
    if artist_id:
        cur.execute(
            "INSERT INTO splits (track_id, profile_id, participant_name, percentage, role) VALUES (?,?,?,?,?)",
            (track_id, artist_id, final_artist_name, 100.0, 'artist')
        )

    con.commit()
    con.close()
    return isrc_to_save

# =========================
# PARSER (REGRAS)
# =========================
def normalize_spaces(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def extract_date_br(text: str) -> Optional[str]:
    m = re.search(r"\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b", text)
    if m:
        d, mth, y = m.group(1), m.group(2), m.group(3)
        if 1 <= int(d) <= 31 and 1 <= int(mth) <= 12:
            return f"{int(d):02d}/{int(mth):02d}/{y}"
    try:
        dt = dateparser.parse(text, dayfirst=True, fuzzy=True, settings={'DATE_ORDER': 'DMY'})
        if dt:
            return dt.strftime("%d/%m/%Y")
    except:
        pass
    return None

def pick_value_after_label(lines, labels):
    for ln in lines:
        for lab in labels:
            if re.match(rf"^{lab}\b", ln, flags=re.IGNORECASE):
                val = re.sub(rf"^{lab}\s*[:\-]?\s*", "", ln, flags=re.IGNORECASE).strip()
                return val or None
    return None

def parse_release_rules(text: str) -> Optional[Dict[str, Any]]:
    raw = text.strip()
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]

    date_found = None
    for ln in lines:
        d = extract_date_br(ln)
        if d:
            date_found = d
            break
    if not date_found:
        date_found = extract_date_br(raw)

    artist = pick_value_after_label(lines, ["artista", "artist"])
    track = pick_value_after_label(lines, ["música", "musica", "faixa", "track", "som", "music"])
    isrc = pick_value_after_label(lines, ["isrc"])

    cleaned = []
    for ln in lines:
        ln_no_label = re.sub(
            r"^(artista|artist|m[uú]sica|musica|faixa|track|som|music|isrc)\s*[:\-]?\s*",
            "",
            ln,
            flags=re.IGNORECASE
        ).strip()
        
        d_in_ln = extract_date_br(ln_no_label)
        if d_in_ln:
            ln_no_label = ln_no_label.replace(d_in_ln, "").strip()
            ln_no_label = re.sub(r"^\s*[-—/]\s*", "", ln_no_label).strip()
            ln_no_label = re.sub(r"\s*[-—/]\s*$", "", ln_no_label).strip()

        if ln_no_label:
            cleaned.append(ln_no_label)

    if len(cleaned) == 1 and (" - " in cleaned[0] or " — " in cleaned[0]):
        parts = re.split(r"\s[-—]\s", cleaned[0])
        parts = [p.strip() for p in parts if p.strip()]
        if len(parts) >= 2:
            artist = artist or parts[0]
            track = track or parts[1]

    if (not artist or not track) and len(cleaned) >= 2:
        artist = artist or cleaned[0]
        track = track or cleaned[1]

    if not artist or not track or not date_found:
        return None

    return {
        "artist": normalize_spaces(artist),
        "track": normalize_spaces(track),
        "isrc": normalize_spaces(isrc) if isrc else None,
        "date": date_found,
        "raw_text": raw,
        "source": "rules"
    }

def parse_release_gemini(text: str) -> Optional[Dict[str, Any]]:
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = (
            "Extraia do texto os campos:\n"
            "- artist\n"
            "- track\n"
            "- isrc\n"
            "- date (formato dd/mm/aaaa)\n\n"
            "Retorne SOMENTE um JSON válido.\n"
            f"Texto:\n{text}"
        )
        resp = model.generate_content(prompt)
        out = (resp.text or "").strip()
        out = re.sub(r"^```json\s*", "", out, flags=re.IGNORECASE).strip()
        out = re.sub(r"^```\s*", "", out).strip()
        out = re.sub(r"\s*```$", "", out).strip()
        data = json.loads(out)
        artist = data.get("artist")
        track = data.get("track")
        isrc = data.get("isrc")
        date_ = data.get("date")
        if not artist or not track or not date_:
            return None
        date_norm = extract_date_br(str(date_)) or str(date_)
        return {
            "artist": normalize_spaces(str(artist)),
            "track": normalize_spaces(str(track)),
            "isrc": normalize_spaces(str(isrc)) if isrc else None,
            "date": date_norm,
            "raw_text": text.strip(),
            "source": "gemini"
        }
    except Exception:
        return None
