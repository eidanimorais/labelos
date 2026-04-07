import os
import re
import json
import sqlite3
import tempfile
from datetime import datetime
from typing import Optional, Dict, Any

import boto3
from botocore.config import Config
from dateutil import parser as dateparser
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

# =========================
# CONFIG
# =========================
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
# Banco local do bot (para pendências)
BOT_PENDING_DB = os.environ.get("BOT_PENDING_DB", "bot_pending.db")
# Banco principal do sistema
MAIN_DB_PATH = os.environ.get("MAIN_DB_PATH", "../../data/db/royalties.db")

# Gemini (opcional). Se não setar, fica 100% regras.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

# R2 Config
R2_ACTIVE_VERSION = os.getenv("R2_ACTIVE_VERSION", "V3")
R2_ACC_ID = os.getenv(f"R2_{R2_ACTIVE_VERSION}_ACCOUNT_ID")
R2_KEY_ID = os.getenv(f"R2_{R2_ACTIVE_VERSION}_ACCESS_KEY_ID")
R2_SECRET = os.getenv(f"R2_{R2_ACTIVE_VERSION}_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv(f"R2_{R2_ACTIVE_VERSION}_BUCKET_NAME")
R2_DOMAIN = os.getenv(f"R2_{R2_ACTIVE_VERSION}_PUBLIC_DOMAIN")

# R2 V5 (Específico para áudio MP3 no sistema original)
R2_V5_ACC_ID = os.getenv("R2_V5_ACCOUNT_ID")
R2_V5_KEY_ID = os.getenv("R2_V5_ACCESS_KEY_ID")
R2_V5_SECRET = os.getenv("R2_V5_SECRET_ACCESS_KEY")
R2_V5_BUCKET = os.getenv("R2_V5_BUCKET_NAME")
R2_V5_DOMAIN = os.getenv("R2_V5_PUBLIC_DOMAIN")

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
# DB (pendências + eventos)
# =========================
def init_db():
    # Banco de pendências
    con = sqlite3.connect(BOT_PENDING_DB)
    cur = con.cursor()
    cur.execute("""
      CREATE TABLE IF NOT EXISTS pending (
        chat_id INTEGER PRIMARY KEY,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    """)
    con.commit()
    con.close()

init_db()

def save_pending(chat_id: int, payload: Dict[str, Any]):
    con = sqlite3.connect(BOT_PENDING_DB)
    cur = con.cursor()
    cur.execute(
        "INSERT OR REPLACE INTO pending (chat_id, payload_json, created_at) VALUES (?,?,?)",
        (chat_id, json.dumps(payload, ensure_ascii=False), datetime.utcnow().isoformat()),
    )
    con.commit()
    con.close()

def load_pending(chat_id: int) -> Optional[Dict[str, Any]]:
    con = sqlite3.connect(BOT_PENDING_DB)
    cur = con.cursor()
    cur.execute("SELECT payload_json FROM pending WHERE chat_id = ?", (chat_id,))
    row = cur.fetchone()
    con.close()
    return json.loads(row[0]) if row else None

def clear_pending(chat_id: int):
    con = sqlite3.connect(BOT_PENDING_DB)
    cur = con.cursor()
    cur.execute("DELETE FROM pending WHERE chat_id = ?", (chat_id,))
    con.commit()
    con.close()

async def upload_file_to_r2(context: ContextTypes.DEFAULT_TYPE, file_id: str, filename: str, folder: str) -> Optional[str]:
    try:
        tg_file = await context.bot.get_file(file_id)
        
        with tempfile.NamedTemporaryFile() as tmp:
            await tg_file.download_to_drive(tmp.name)
            with open(tmp.name, "rb") as f:
                content = f.read()
                
        # Define qual conta R2 usar
        version = R2_ACTIVE_VERSION
        if filename.lower().endswith(".mp3"):
            version = "V5"
            
        client, bucket, domain = get_r2_client(version)
        if not client:
            return None
            
        key = f"{folder}/{filename}"
        content_type = "audio/mpeg" if filename.lower().endswith(".mp3") else "audio/wav" if filename.lower().endswith(".wav") else "image/jpeg"
        
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

async def persist_release(chat_id: int, payload: Dict[str, Any], context: ContextTypes.DEFAULT_TYPE):
    # 1. Faz upload de arquivos pendentes se existirem
    cover_url = None
    audio_url = None
    
    if payload.get("pending_cover_id"):
        filename = f"cover_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        cover_url = await upload_file_to_r2(context, payload["pending_cover_id"], filename, "covers")
        
    if payload.get("pending_audio_id"):
        ext = payload.get("pending_audio_ext", "wav")
        filename = f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
        audio_url = await upload_file_to_r2(context, payload["pending_audio_id"], filename, "audio")

    # 2. Conecta ao banco principal
    con = sqlite3.connect(MAIN_DB_PATH)
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
    
    # 7. Log histórico local
    con_log = sqlite3.connect(BOT_PENDING_DB)
    cur_log = con_log.cursor()
    cur_log.execute("""
      CREATE TABLE IF NOT EXISTS bot_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        artist TEXT,
        track TEXT,
        date TEXT,
        cover_url TEXT,
        audio_url TEXT,
        isrc TEXT,
        created_at TEXT
      )
    """)
    cur_log.execute(
        "INSERT INTO bot_history (chat_id, artist, track, date, cover_url, audio_url, isrc, created_at) VALUES (?,?,?,?,?,?,?,?)",
        (chat_id, final_artist_name, payload["track"], payload["date"], cover_url, audio_url, isrc_to_save, datetime.utcnow().isoformat())
    )
    con_log.commit()
    con_log.close()

# =========================
# PARSER (REGRAS)
# =========================
def normalize_spaces(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def extract_date_br(text: str) -> Optional[str]:
    # Prioridade para o formato explícito DD/MM/YYYY
    m = re.search(r"\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b", text)
    if m:
        d, mth, y = m.group(1), m.group(2), m.group(3)
        # Validação básica para evitar meses/dias irreais
        if 1 <= int(d) <= 31 and 1 <= int(mth) <= 12:
            return f"{int(d):02d}/{int(mth):02d}/{y}"

    # tenta data por extenso/solta no texto com dateparser apenas se falhar o regex
    try:
        dt = dateparser.parse(text, dayfirst=True, fuzzy=True, settings={'DATE_ORDER': 'DMY'})
        if dt:
            return dt.strftime("%d/%m/%Y")
    except Exception:
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

    # 1) data em qualquer linha
    date_found = None
    for ln in lines:
        d = extract_date_br(ln)
        if d:
            date_found = d
            break
    if not date_found:
        date_found = extract_date_br(raw)

    # 2) labels
    artist = pick_value_after_label(lines, ["artista", "artist"])
    track = pick_value_after_label(lines, ["música", "musica", "faixa", "track", "som", "music"])
    isrc = pick_value_after_label(lines, ["isrc"])

    # 3) fallback: padrão "A - B - data" ou só 2 linhas + data
    def is_date_line(ln): return extract_date_br(ln) is not None

    cleaned = []
    for ln in lines:
        # Tira o label se existir pra não confundir o conteúdo
        ln_no_label = re.sub(
            r"^(artista|artist|m[uú]sica|musica|faixa|track|som|music|isrc)\s*[:\-]?\s*",
            "",
            ln,
            flags=re.IGNORECASE
        ).strip()
        
        # Tira a data da linha se existir (pra sobrar só o texto)
        d_in_ln = extract_date_br(ln_no_label)
        if d_in_ln:
            # Remove a data encontrada da string
            ln_no_label = ln_no_label.replace(d_in_ln, "").strip()
            # Remove traços ou barras extras que sobraram
            ln_no_label = re.sub(r"^\s*[-—/]\s*", "", ln_no_label).strip()
            ln_no_label = re.sub(r"\s*[-—/]\s*$", "", ln_no_label).strip()

        if ln_no_label:
            cleaned.append(ln_no_label)

    # tenta split por " - " se tiver 2 campos juntos
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

# =========================
# PARSER (GEMINI - opcional)
# =========================
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
            "Retorne SOMENTE um JSON válido com essas chaves.\n"
            "Se faltar algum campo, use null.\n\n"
            f"Texto:\n{text}"
        )

        resp = model.generate_content(prompt)
        # Limpeza básica do markdown do Gemini
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

        # normaliza data se vier diferente
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

# =========================
# CONFIRMAÇÃO
# =========================
def format_confirmation(payload: Dict[str, Any]) -> str:
    msg = (
        "Confirma?\n\n"
        f"Artista: {payload['artist']}\n"
        f"Música: {payload['track']}\n"
        f"ISRC: {payload.get('isrc') or '⚠️ Não informado (será gerado BOT-)'}\n"
        f"Data: {payload['date']}\n"
    )
    if payload.get("pending_cover_id"):
        msg += "🖼️ Capa anexada\n"
    if payload.get("pending_audio_id"):
        msg += f"🎵 Áudio anexado (.{payload.get('pending_audio_ext')})\n"
        
    msg += "\nResponda: confirmar ou cancelar"
    return msg

# =========================
# HANDLERS
# =========================
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Me manda artista, música e data do jeito que você escreveria.\n\n"
        "Você também pode anexar a **Capa** (como foto) e a **Música** (como arquivo .wav ou .mp3) junto com a mensagem ou depois dela!\n\n"
        "Exemplo:\n"
        "Artista: Lil Chainz\n"
        "Música: Coração Vermelho\n"
        "ISRC: BR-XXX-23-00001\n"
        "Data: 23/02/2026\n\n"
        "Eu vou devolver organizado pra você confirmar."
    )

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    text = update.message.text.strip()
    low = text.lower()

    # confirmar/cancelar
    if low in {"confirmar", "confirmo", "sim", "positivo"}:
        pending = load_pending(chat_id)
        if not pending:
            await update.message.reply_text("Não tem nada pendente pra confirmar. Me manda os dados primeiro.")
            return
        
        await update.message.reply_text("⏳ Processando e fazendo upload dos arquivos... Aguarde um instante.")
        await persist_release(chat_id, pending, context)
        clear_pending(chat_id)
        await update.message.reply_text("✅ Tudo salvo e arquivos enviados para o R2!")
        return

    if low in {"cancelar", "cancela", "não", "nao", "negativo"}:
        clear_pending(chat_id)
        await update.message.reply_text("✅ Cancelado.")
        return

    # 1) regras
    payload = parse_release_rules(text)

    # 2) fallback gemini (só se precisar)
    if not payload:
        payload = parse_release_gemini(text)

    if not payload:
        # Se for apenas um texto solto e já tiver algo pendente, talvez o usuário queira só confirmar por texto
        await update.message.reply_text(
            "Não consegui identificar tudo.\n\n"
            "Tenta mandar algo assim:\n"
            "Artista: ...\n"
            "Música: ...\n"
            "dd/mm/aaaa"
        )
        return

    # Preserva arquivos já enviados se estiver corrigindo apenas o texto
    old_pending = load_pending(chat_id)
    if old_pending:
        if old_pending.get("pending_cover_id"):
            payload["pending_cover_id"] = old_pending["pending_cover_id"]
        if old_pending.get("pending_audio_id"):
            payload["pending_audio_id"] = old_pending["pending_audio_id"]
            payload["pending_audio_ext"] = old_pending["pending_audio_ext"]

    save_pending(chat_id, payload)
    await update.message.reply_text(format_confirmation(payload))

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    # Pega a foto de maior resolução
    photo_id = update.message.photo[-1].file_id
    
    payload = load_pending(chat_id) or {"artist": "Desconhecido", "track": "Desconhecida", "date": datetime.now().strftime("%d/%m/%Y")}
    
    # Se a foto veio com legenda, tenta extrair os dados da legenda
    if update.message.caption:
        new_payload = parse_release_rules(update.message.caption) or parse_release_gemini(update.message.caption)
        if new_payload:
            payload.update(new_payload)
            
    payload["pending_cover_id"] = photo_id
    save_pending(chat_id, payload)
    
    await update.message.reply_text("🖼️ Capa recebida!\n\n" + format_confirmation(payload))

async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    doc = update.message.document
    
    # Verifica se é áudio
    ext = doc.file_name.split(".")[-1].lower() if doc.file_name else ""
    if ext not in ["wav", "mp3"]:
        await update.message.reply_text("⚠️ Por favor, envie o áudio no formato .wav ou .mp3")
        return
        
    payload = load_pending(chat_id) or {"artist": "Desconhecido", "track": "Desconhecida", "date": datetime.now().strftime("%d/%m/%Y")}
    
    if update.message.caption:
        new_payload = parse_release_rules(update.message.caption) or parse_release_gemini(update.message.caption)
        if new_payload:
            payload.update(new_payload)
            
    payload["pending_audio_id"] = doc.file_id
    payload["pending_audio_ext"] = ext
    save_pending(chat_id, payload)
    
    await update.message.reply_text(f"🎵 Áudio (.{ext}) recebido!\n\n" + format_confirmation(payload))

def main():
    if not BOT_TOKEN:
        print("AVISO: TELEGRAM_BOT_TOKEN não definido no .env ou ambiente.")
        return

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))
    
    print("Bot rodando com suporte a arquivos...")
    app.run_polling()

if __name__ == "__main__":
    main()
