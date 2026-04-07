import os
import json
import sqlite3
import requests
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv

import bot_logic

load_dotenv()

app = FastAPI()

# =========================
# CONFIG
# =========================
VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "SEU_TOKEN_ESCOLHIDO")
ACCESS_TOKEN = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")

# Banco local para estados do bot
WHATSAPP_DB = "whatsapp_bot.db"

def init_db():
    con = sqlite3.connect(WHATSAPP_DB)
    cur = con.cursor()
    cur.execute("""
      CREATE TABLE IF NOT EXISTS sessions (
        phone_number TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    """)
    con.commit()
    con.close()

init_db()

# =========================
# HELPERS
# =========================
def send_whatsapp_message(to: str, text: str):
    url = f"https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text}
    }
    resp = requests.post(url, headers=headers, json=payload)
    print(f"DEBUG: WhatsApp API Response: {resp.status_code} - {resp.text}")
    return resp.json()

def send_whatsapp_template(to: str, template_name: str = "hello_world", language_code: str = "en_US"):
    url = f"https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language_code}
        }
    }
    resp = requests.post(url, headers=headers, json=payload)
    print(f"DEBUG: WhatsApp Template Response: {resp.status_code} - {resp.text}")
    return resp.json()

def download_whatsapp_media(media_id: str) -> Optional[bytes]:
    url = f"https://graph.facebook.com/v17.0/{media_id}"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        return None
    
    download_url = resp.json().get("url")
    if not download_url:
        return None
        
    media_resp = requests.get(download_url, headers=headers)
    if media_resp.status_code == 200:
        return media_resp.content
    return None

def save_session(phone: str, payload: Dict[str, Any]):
    con = sqlite3.connect(WHATSAPP_DB)
    cur = con.cursor()
    cur.execute(
        "INSERT OR REPLACE INTO sessions (phone_number, payload_json, created_at) VALUES (?,?,?)",
        (phone, json.dumps(payload, ensure_ascii=False), datetime.utcnow().isoformat()),
    )
    con.commit()
    con.close()

def load_session(phone: str) -> Optional[Dict[str, Any]]:
    con = sqlite3.connect(WHATSAPP_DB)
    cur = con.cursor()
    cur.execute("SELECT payload_json FROM sessions WHERE phone_number = ?", (phone,))
    row = cur.fetchone()
    con.close()
    return json.loads(row[0]) if row else None

def clear_session(phone: str):
    con = sqlite3.connect(WHATSAPP_DB)
    cur = con.cursor()
    cur.execute("DELETE FROM sessions WHERE phone_number = ?", (phone,))
    con.commit()
    con.close()

# =========================
# WEBHOOK
# =========================

@app.get("/webhook")
async def verify(request: Request):
    """Necessário para validar o webhook na Meta"""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        print("Webhook verificado com sucesso!")
        return int(challenge)
    
    raise HTTPException(status_code=403, detail="Erro de validação")

@app.post("/webhook")
async def handle_webhook(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    print(f"DEBUG: Webhook Received Data: {json.dumps(data)}")
    
    # Verifica se é uma notificação de mensagem
    try:
        entry = data.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        
        if "messages" not in value:
            return {"status": "ignorado"}
            
        message_obj = value["messages"][0]
        from_phone = message_obj["from"]
        msg_type = message_obj["type"]
        
        if msg_type == "text":
            text = message_obj["text"]["body"].strip()
            background_tasks.add_task(process_text_message, from_phone, text)
            
        elif msg_type == "image":
            image_id = message_obj["image"]["id"]
            caption = message_obj.get("image", {}).get("caption", "")
            background_tasks.add_task(process_media_message, from_phone, image_id, "image", caption)
            
        elif msg_type == "document":
            doc_id = message_obj["document"]["id"]
            filename = message_obj["document"].get("filename", "audio.wav")
            caption = message_obj.get("document", {}).get("caption", "")
            background_tasks.add_task(process_media_message, from_phone, doc_id, "document", caption, filename)

        return {"status": "recebido"}
        
    except Exception as e:
        print(f"Erro ao processar webhook: {e}")
        return {"status": "erro"}

# =========================
# LOGIC
# =========================

async def process_text_message(phone: str, text: str):
    low = text.lower()
    
    # 1. Comandos de Fluxo
    if low in {"confirmar", "confirmo", "sim", "positivo"}:
        session = load_session(phone)
        if not session:
            send_whatsapp_message(phone, "Não encontrei nada pendente para confirmar. Me mande os dados da música primeiro!")
            return
            
        send_whatsapp_message(phone, "⏳ Processando... Isso pode levar alguns segundos.")
        
        # Recupera bytes de arquivos se houver IDs salvos temporariamente na sessão
        # Nota: Idealmente salvaríamos os bytes ou url temporária, mas para o WhatsApp Cloud API
        # o media_id expira rápido. Aqui vamos baixar na hora da confirmação se estiver na sessão.
        cover_bytes = None
        if "pending_cover_id" in session:
            cover_bytes = download_whatsapp_media(session["pending_cover_id"])
            
        audio_bytes = None
        audio_ext = "wav"
        if "pending_audio_id" in session:
            audio_bytes = download_whatsapp_media(session["pending_audio_id"])
            audio_ext = session.get("pending_audio_ext", "wav")
            
        try:
            isrc = bot_logic.persist_release(session, cover_bytes, audio_bytes, audio_ext)
            clear_session(phone)
            send_whatsapp_message(phone, f"✅ Sucesso! Música cadastrada com ISRC: {isrc}")
        except Exception as e:
            send_whatsapp_message(phone, f"❌ Erro ao salvar: {str(e)}")
        return

    if low in {"cancelar", "cancela", "não", "nao", "negativo"}:
        clear_session(phone)
        send_whatsapp_message(phone, "✅ Cancelado. O que deseja fazer agora?")
        return

    if low == "/start" or low == "oi" or low == "olá":
        send_whatsapp_message(phone, (
            "Olá! Sou o assistente de Royalties. 🎵\n\n"
            "Me mande os dados da música (Artista, Música, ISRC, Data) e eu cuido do resto.\n\n"
            "Você também pode enviar a Capa e o Áudio!"
        ))
        return

    if low == "testar":
        send_whatsapp_template(phone)
        return

    # 2. Parsing de Lançamento
    payload = bot_logic.parse_release_rules(text)
    if not payload:
        payload = bot_logic.parse_release_gemini(text)
        
    if not payload:
        send_whatsapp_message(phone, "Não entendi os dados. Tente assim:\nArtista: ...\nMúsica: ...\nData: DD/MM/AAAA")
        return

    # Preserva arquivos se já existirem na sessão
    old_session = load_session(phone)
    if old_session:
        if "pending_cover_id" in old_session:
            payload["pending_cover_id"] = old_session["pending_cover_id"]
        if "pending_audio_id" in old_session:
            payload["pending_audio_id"] = old_session["pending_audio_id"]
            payload["pending_audio_ext"] = old_session.get("pending_audio_ext")

    save_session(phone, payload)
    send_whatsapp_message(phone, format_confirmation(payload))

async def process_media_message(phone: str, media_id: str, media_type: str, caption: str = "", filename: str = ""):
    session = load_session(phone) or {
        "artist": "Desconhecido", 
        "track": "Desconhecida", 
        "date": datetime.now().strftime("%d/%m/%Y")
    }
    
    if caption:
        new_payload = bot_logic.parse_release_rules(caption) or bot_logic.parse_release_gemini(caption)
        if new_payload:
            session.update(new_payload)
            
    if media_type == "image":
        session["pending_cover_id"] = media_id
        send_whatsapp_message(phone, "🖼️ Capa recebida!")
    else:
        ext = filename.split(".")[-1].lower() if "." in filename else "wav"
        if ext not in ["wav", "mp3"]:
            send_whatsapp_message(phone, "⚠️ Formato de áudio não suportado (use .wav ou .mp3)")
            return
        session["pending_audio_id"] = media_id
        session["pending_audio_ext"] = ext
        send_whatsapp_message(phone, f"🎵 Áudio (.{ext}) recebido!")
        
    save_session(phone, session)
    send_whatsapp_message(phone, format_confirmation(session))

def format_confirmation(payload: Dict[str, Any]) -> str:
    msg = (
        "CONFIRMAÇÃO DE DADOS\n"
        "-------------------\n"
        f"👤 Artista: {payload['artist']}\n"
        f"🎵 Música: {payload['track']}\n"
        f"🆔 ISRC: {payload.get('isrc') or 'Será gerado BOT-'}\n"
        f"📅 Data: {payload['date']}\n"
    )
    if "pending_cover_id" in payload:
        msg += "🖼️ Capa vinculada\n"
    if "pending_audio_id" in payload:
        msg += f"🔊 Áudio vinculado (.{payload.get('pending_audio_ext')})\n"
        
    msg += "\nResponda 'confirmar' para salvar ou 'cancelar'."
    return msg

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
