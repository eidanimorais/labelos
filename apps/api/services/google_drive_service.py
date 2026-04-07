import os
import pickle
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
import io

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive.file']

class GoogleDriveService:
    def __init__(self):
        self.creds = None
        self.service = None
        self._authenticate()

    def _authenticate(self):
        # The file token.pickle stores the user's access and refresh tokens
        pickle_path = os.path.join(os.path.dirname(__file__), 'token.pickle')
        # Go up 4 levels: services -> backend -> apps -> root -> data -> uploads
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data', 'uploads')
        
        if not os.path.exists(uploads_dir):
            os.makedirs(uploads_dir, exist_ok=True)
            print(f"Created directory for credentials: {uploads_dir}")

        # Find the credential file dynamically
        creds_path = None
        for f in os.listdir(uploads_dir):
            if f.startswith("client_secret") and f.endswith(".json"):
                creds_path = os.path.join(uploads_dir, f)
                break
        
        if not creds_path:
            print("CRITICAL: No Google Drive credentials found in uploads folder.")
            print(f"Please place 'client_secret.json' in: {uploads_dir}")
            return

        if os.path.exists(pickle_path):
            with open(pickle_path, 'rb') as token:
                self.creds = pickle.load(token)
        
        # If there are no (valid) credentials available, let the user log in.
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
                # This will open the browser for local authentication
                self.creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open(pickle_path, 'wb') as token:
                pickle.dump(self.creds, token)

        self.service = build('drive', 'v3', credentials=self.creds)

    def find_or_create_folder(self, folder_name: str, parent_id: str = None) -> str:
        """Finds a folder by name or creates it if not found."""
        query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
        if parent_id:
            query += f" and '{parent_id}' in parents"
        
        results = self.service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        items = results.get('files', [])

        if items:
            return items[0]['id']
        else:
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            if parent_id:
                file_metadata['parents'] = [parent_id]
            
            folder = self.service.files().create(body=file_metadata, fields='id').execute()
            return folder.get('id')

    def upload_file(self, content: bytes, filename: str, mimetype: str, folder_id: str):
        """Uploads a file to a specific folder on Google Drive."""
        file_metadata = {
            'name': filename,
            'parents': [folder_id]
        }
        media = MediaIoBaseUpload(io.BytesIO(content), mimetype=mimetype, resumable=True)
        file = self.service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        return file.get('id')

    def mirror_master_audio(self, content: bytes, filename: str, mimetype: str, artist: str, year: str, track_title: str):
        """Implement the specific folder structure: /gravadora/artist/fonogramas/year/track_title"""
        try:
            # 1. Base Folder
            root_id = self.find_or_create_folder("gravadora")
            # 2. Artist Folder
            artist_id = self.find_or_create_folder(artist, parent_id=root_id)
            # 3. Fonogramas Folder
            fonogramas_id = self.find_or_create_folder("fonogramas", parent_id=artist_id)
            # 4. Year Folder
            year_id = self.find_or_create_folder(year, parent_id=fonogramas_id)
            # 5. Track Title Folder
            track_id = self.find_or_create_folder(track_title, parent_id=year_id)
            
            # 6. Upload
            return self.upload_file(content, filename, mimetype, track_id)
        except Exception as e:
            print(f"Error mirroring to Google Drive: {e}")
            return None

    def download_file(self, file_id: str) -> bytes:
        """Downloads a file's content from Google Drive given its ID."""
        try:
            request = self.service.files().get_media(fileId=file_id)
            file = io.BytesIO()
            downloader = MediaIoBaseDownload(file, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            return file.getvalue()
        except Exception as e:
            print(f"Error downloading from Drive: {e}")
            return None

    def extract_id_from_url(self, url: str) -> str:
        """Extracts the file ID from a standard Google Drive URL."""
        # Supported format: https://drive.google.com/file/d/VIDEO_ID/view?usp=drive_link
        import re
        match = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
        if match:
            return match.group(1)
        return None

# Singleton instance
_drive_instance = None

def get_drive_service():
    global _drive_instance
    if _drive_instance is None:
        _drive_instance = GoogleDriveService()
    return _drive_instance
