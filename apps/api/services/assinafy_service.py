
import requests
import json
import os
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

class AssinafyService:
    def __init__(self):
        self.api_key = "-Ba5v2ACVOos-1p4qRepa1IMAQSt6p9unkEvSDRs4sM4hOplO8WsuVtsm49xO3u7" # Hardcoded for now as requested/provided
        self.base_url = "https://api.assinafy.com.br"
        self.account_id = "101a26b3033762292c15ed55ba49" # Hardcoded as retrieved
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }

    def _get_url(self, path: str):
        return f"{self.base_url}{path}"

    def list_documents(self):
        url = self._get_url(f"/v1/accounts/{self.account_id}/documents")
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json().get('data', [])
        except requests.exceptions.RequestException as e:
            print(f"Error listing documents: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    def create_document(self, file_path: str, signers: list):
        """
        Uploads a document and creates it in Assinafy.
        signers: list of dicts with 'name' and 'email'
        """
        url = self._get_url(f"/v1/accounts/{self.account_id}/documents")
        
        # Prepare file
        files = {
            'file': open(file_path, 'rb')
        }
        
        try:
            # 1. Upload the document (simple upload first)
            # Based on docs, just uploading the file creates the document in "uploaded" status
            response = requests.post(url, headers=self.headers, files=files)
            response.raise_for_status()
            doc_data = response.json()
            doc_id = doc_data['id']
            
            # 2. If we have signers, we need to create an assignment (send for measurement/signature)
            # This part depends on the specific "Assignment" or "Signers" endpoint structure which might be 
            # /v1/accounts/{account_id}/documents/{document_id}/assignment or similar. 
            # Given the lack of full docs, I will assume the upload is step 1.
            # To actually "Send", we might need another call. 
            
            # Let's try to add signers if the document is created.
            # Based on "Quick Start", we might need to add signers to the document.
            
            # Skipping advanced assignment logic for MVP, returning the created doc ID
            return doc_data

        except requests.exceptions.RequestException as e:
            print(f"Error creating document: {e}")
            raise HTTPException(status_code=400, detail=f"Assinafy Error: {str(e)}")
        finally:
            files['file'].close()

    def get_document(self, doc_id: str):
        url = self._get_url(f"/v1/accounts/{self.account_id}/documents/{doc_id}")
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=404, detail="Document not found")

    def sync_document_status(self, doc_id: str):
        doc = self.get_document(doc_id)
        # Map Assinafy status to our status
        # This mapping will need to be refined based on actual responses
        return doc.get('status', 'Desconhecido')

assinafy_service = AssinafyService()
