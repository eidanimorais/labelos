
import sys
import time
import os
import logging
import zipfile
import tempfile
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from apps.api.services.google_drive_service import get_drive_service

# Configuração de Logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

class GDriveSyncHandler(FileSystemEventHandler):
    def __init__(self):
        self.drive_service = get_drive_service()
        # ID direto da pasta 'LabelOS EXTRACTS' dentro de EMPRESARIAL > LABEL OS
        self.folder_id = "12VX8Vo2Nw1EBwivClRYe6sn_yx-T5amr"
        logging.info(f"Pasta de destino: 'LabelOS EXTRACTS' (ID: {self.folder_id})")

    def sync_existing_files(self, path):
        """Uploads all existing files in the directory on startup."""
        logging.info(f"⏳ Verificando arquivos existentes em '{path}'...")
        if not os.path.exists(path):
            return

        for filename in os.listdir(path):
            file_path = os.path.join(path, filename)
            if os.path.isfile(file_path) and not filename.startswith('.'):
                logging.info(f"Sincronizando arquivo existente: {filename}")
                self.upload_file(file_path, filename)
        logging.info("✅ Sincronização de arquivos individuais concluída.")

    def create_and_upload_zip(self, path):
        """Creates a zip of all files in the directory and uploads it."""
        logging.info("📦 Criando backup zipado de todos os arquivos...")
        if not os.path.exists(path):
            return

        files = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and not f.startswith('.')]
        if not files:
            logging.info("Nenhum arquivo para zipar.")
            return

        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        zip_name = f"extracts_backup_{timestamp}.zip"

        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with zipfile.ZipFile(tmp_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for filename in sorted(files):
                    file_path = os.path.join(path, filename)
                    zf.write(file_path, filename)
                    logging.info(f"  📄 Adicionado ao zip: {filename}")

            zip_size_mb = os.path.getsize(tmp_path) / (1024 * 1024)
            logging.info(f"📦 Zip criado: {zip_name} ({zip_size_mb:.1f} MB)")

            self.upload_file(tmp_path, zip_name)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def on_created(self, event):
        if event.is_directory:
            return
        
        # Ignora arquivos ocultos (ex: .DS_Store)
        filename = os.path.basename(event.src_path)
        if filename.startswith('.'):
            return

        logging.info(f"Novo arquivo detectado: {filename}")
        self.upload_file(event.src_path, filename)

    def upload_file(self, file_path, filename):
        try:
            # Determina mimetype básico
            import mimetypes
            mime_type, _ = mimetypes.guess_type(file_path)
            if mime_type is None:
                mime_type = 'application/octet-stream'

            logging.info(f"Iniciando upload de '{filename}'...")
            
            with open(file_path, 'rb') as f:
                content = f.read()
                
            file_id = self.drive_service.upload_file(
                content=content, 
                filename=filename, 
                mimetype=mime_type, 
                folder_id=self.folder_id
            )
            
            if file_id:
                logging.info(f"✅ Upload concluído com sucesso! ID: {file_id}")
            else:
                logging.error(f"❌ Falha no upload de '{filename}'")

        except Exception as e:
            logging.error(f"❌ Erro ao processar arquivo: {e}")

if __name__ == "__main__":
    path = "data/extracts" # Pasta a ser monitorada
    
    # Garante que a pasta existe
    if not os.path.exists(path):
        os.makedirs(path)
        logging.info(f"Pasta '{path}' criada.")

    event_handler = GDriveSyncHandler()
    
    # Envia apenas o zip compactado para economizar espaço
    event_handler.create_and_upload_zip(path)
    logging.info("✅ Backup zipado enviado com sucesso.")

    observer = Observer()
    observer.schedule(event_handler, path, recursive=False)
    
    logging.info(f"👀 Monitorando a pasta '{path}' para novos arquivos...")
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    
    observer.join()
