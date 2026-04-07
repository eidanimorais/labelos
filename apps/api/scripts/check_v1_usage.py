
import os
import sys
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

def check_v1():
    account_id = os.getenv("R2_V1_ACCOUNT_ID")
    key = os.getenv("R2_V1_ACCESS_KEY_ID")
    secret = os.getenv("R2_V1_SECRET_ACCESS_KEY")
    bucket = os.getenv("R2_V1_BUCKET_NAME")

    print(f"Checking {bucket}...")
    
    client = boto3.client(
        's3',
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=key,
        aws_secret_access_key=secret,
        region_name="auto",
        config=Config(s3={"addressing_style": "virtual"})
    )

    paginator = client.get_paginator('list_objects_v2')
    
    total_size = 0
    file_count = 0
    folder_usage = {}

    for page in paginator.paginate(Bucket=bucket):
        if 'Contents' in page:
            for obj in page['Contents']:
                size = obj['Size']
                key = obj['Key']
                total_size += size
                file_count += 1
                
                # Folder stats
                folder = key.split('/')[0] + '/' if '/' in key else 'root'
                folder_usage[folder] = folder_usage.get(folder, 0) + size

    gb_size = total_size / (1024**3)
    
    print(f"Total Objects: {file_count}")
    print(f"Total Size: {gb_size:.4f} GB")
    print("-" * 30)
    print("Usage by Folder:")
    for folder, size in sorted(folder_usage.items(), key=lambda x: x[1], reverse=True):
        print(f"  {folder}: {size / (1024**3):.4f} GB")

if __name__ == "__main__":
    check_v1()
