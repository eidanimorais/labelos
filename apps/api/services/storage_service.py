import boto3
import os
from botocore.config import Config
from typing import Optional, List, Dict

class R2Account:
    def __init__(self, prefix: str):
        self.version = prefix
        self.account_id = os.getenv(f"R2_{prefix}_ACCOUNT_ID")
        self.access_key_id = os.getenv(f"R2_{prefix}_ACCESS_KEY_ID")
        self.secret_access_key = os.getenv(f"R2_{prefix}_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv(f"R2_{prefix}_BUCKET_NAME")
        self.public_domain = os.getenv(f"R2_{prefix}_PUBLIC_DOMAIN")
        self.client = self._create_client()

    def _create_client(self):
        if not all([self.account_id, self.access_key_id, self.secret_access_key]):
            return None
        endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"
        try:
            return boto3.client(
                service_name="s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=self.access_key_id,
                aws_secret_access_key=self.secret_access_key,
                region_name="auto",
                config=Config(s3={"addressing_style": "virtual"})
            )
        except Exception as e:
            print(f"Failed to create R2 client for {self.version}: {e}")
            return None

    def get_usage_bytes(self) -> int:
        if not self.client or not self.bucket_name:
            return 0
        try:
            total_size = 0
            paginator = self.client.get_paginator('list_objects_v2')
            for page in paginator.paginate(Bucket=self.bucket_name):
                for obj in page.get('Contents', []):
                    total_size += obj['Size']
            return total_size
        except Exception as e:
            print(f"Error checking usage for {self.version}: {e}")
            return 0

class MultiAccountStorageService:
    def __init__(self):
        self.accounts = {
            "V1": R2Account("V1"),
            "V2": R2Account("V2"),
            "V3": R2Account("V3"),
            "V4": R2Account("V4"),
            "V5": R2Account("V5")
        }
        self.max_size_bytes = float(os.getenv("R2_MAX_SIZE_GB", 9.9)) * 1024 * 1024 * 1024
        self.active_version = os.getenv("R2_ACTIVE_VERSION", "V1")

    def get_active_account(self) -> Optional[R2Account]:
        # Start with the configured active version
        versions = ["V1", "V2", "V3", "V4", "V5"] # Expand as needed
        start_idx = versions.index(self.active_version) if self.active_version in versions else 0
        
        for i in range(start_idx, len(versions)):
            version = versions[i]
            account = self.accounts.get(version)
            if not account or not account.client:
                continue
            
            usage = account.get_usage_bytes()
            if usage < self.max_size_bytes:
                if version != self.active_version:
                    print(f"Auto-switching account to {version} due to overflow.")
                    # In a production app, we might want to update the .env or a DB setting here
                return account
            else:
                print(f"Account {version} reached limit ({usage/1e9:.2f}GB / {self.max_size_bytes/1e9:.2f}GB)")
        
        print("CRITICAL: All R2 accounts are full!")
        return None

# Singleton instance
_service = MultiAccountStorageService()

def upload_to_r2(file_content: bytes, filename: str, content_type: str, folder: str = "audio") -> Optional[str]:
    # If it's an MP3, try V5 first
    account = None
    if content_type == "audio/mpeg" or filename.lower().endswith(".mp3"):
        account = _service.accounts.get("V5")
    
    if not account or not account.client:
        account = _service.get_active_account()
        
    if not account:
        return None
        
    try:
        key = f"{folder}/{filename}"
        account.client.put_object(
            Bucket=account.bucket_name,
            Key=key,
            Body=file_content,
            ContentType=content_type
        )
        
        # Construct the URL
        if account.public_domain:
            domain = account.public_domain
            if not domain.startswith("http"):
                domain = f"https://{domain}"
            return f"{domain}/{key}"
        else:
            return f"https://{account.account_id}.r2.cloudflarestorage.com/{account.bucket_name}/{key}"
            
    except Exception as e:
        print(f"Error uploading to R2: {e}")
        return None

def delete_from_r2(filename: str, folder: str = "masters"):
    # Note: Deletion is tricky with multiple accounts if we don't know which one it was in.
    # For now, try all accounts (or better, we should store the version in the DB record).
    # Since existing records don't have this, we try all.
    success = False
    for account in _service.accounts.values():
        if not account.client: continue
        try:
            account.client.delete_object(Bucket=account.bucket_name, Key=f"{folder}/{filename}")
            success = True
        except:
            pass
    return success

def get_storage_stats():
    """Returns usage stats for all accounts for the dashboard/alerts."""
    stats = {}
    for version, account in _service.accounts.items():
        usage = account.get_usage_bytes()
        stats[version] = {
            "usage_gb": usage / (1024**3),
            "limit_gb": _service.max_size_bytes / (1024**3),
            "percent": (usage / _service.max_size_bytes) * 100 if _service.max_size_bytes > 0 else 0
        }
    return stats
