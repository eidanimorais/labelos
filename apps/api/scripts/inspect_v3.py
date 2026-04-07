
import os
import sys
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

def inspect_v3():
    account_id = os.getenv("R2_V3_ACCOUNT_ID")
    key = os.getenv("R2_V3_ACCESS_KEY_ID")
    secret = os.getenv("R2_V3_SECRET_ACCESS_KEY")
    bucket = os.getenv("R2_V3_BUCKET_NAME")

    if not all([account_id, key, secret, bucket]):
        print("V3 not configured.")
        return

    client = boto3.client(
        's3',
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=key,
        aws_secret_access_key=secret,
        region_name="auto",
        config=Config(s3={"addressing_style": "virtual"})
    )

    print(f"Inspecting {bucket}...")
    paginator = client.get_paginator('list_objects_v2')
    
    counts = {}
    for page in paginator.paginate(Bucket=bucket):
        if 'Contents' in page:
            for obj in page['Contents']:
                folder = obj['Key'].split('/')[0] + '/' if '/' in obj['Key'] else 'root'
                counts[folder] = counts.get(folder, 0) + 1
    
    print("Folder Structure:")
    for folder, count in counts.items():
        print(f"  {folder}: {count} files")

if __name__ == "__main__":
    inspect_v3()
