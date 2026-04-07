import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def authenticate():
    creds = None
    # The file token.pickle stores the user's access and refresh tokens
    pickle_path = os.path.join(os.path.dirname(__file__), 'services/token.pickle')
    uploads_dir = os.path.join(os.path.dirname(__file__), '../uploads')

    # Find the credential file dynamically
    creds_path = None
    for f in os.listdir(uploads_dir):
        if f.startswith("client_secret") and f.endswith(".json"):
            creds_path = os.path.join(uploads_dir, f)
            break

    if not creds_path:
        print("CRITICAL: No Google Drive credentials found in uploads folder.")
        return

    if os.path.exists(pickle_path):
        with open(pickle_path, 'rb') as token:
            creds = pickle.load(token)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired credentials...")
            creds.refresh(Request())
        else:
            print("Starting new authentication flow...")
            flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
            # This opens the browser
            creds = flow.run_local_server(port=0)
        
        with open(pickle_path, 'wb') as token:
            pickle.dump(creds, token)
        print(f"Authentication successful! Token saved to {pickle_path}")

if __name__ == '__main__':
    authenticate()
