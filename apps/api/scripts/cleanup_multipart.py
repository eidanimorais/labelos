
import os
import sys
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

# R2 Config
def get_client(prefix):
    account_id = os.getenv(f"R2_{prefix}_ACCOUNT_ID")
    key = os.getenv(f"R2_{prefix}_ACCESS_KEY_ID")
    secret = os.getenv(f"R2_{prefix}_SECRET_ACCESS_KEY")
    bucket = os.getenv(f"R2_{prefix}_BUCKET_NAME")
    
    if not all([account_id, key, secret, bucket]):
        return None, None

    client = boto3.client(
        's3',
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=key,
        aws_secret_access_key=secret,
        region_name="auto",
        config=Config(s3={"addressing_style": "virtual"})
    )
    return client, bucket

def cleanup_bucket(version):
    client, bucket = get_client(version)
    if not client:
        print(f"Skipping {version} (not configured)")
        return

    print(f"Checking {version} ({bucket})...")
    
    try:
        # List multipart uploads
        uploads = client.list_multipart_uploads(Bucket=bucket)
        
        if 'Uploads' not in uploads:
            print(f"✅ No incomplete uploads in {version}.")
            return

        print(f"Found {len(uploads['Uploads'])} incomplete uploads.")
        
        for u in uploads['Uploads']:
            print(f"Aborting upload for: {u['Key']} (UploadId: {u['UploadId']})")
            client.abort_multipart_upload(
                Bucket=bucket,
                Key=u['Key'],
                UploadId=u['UploadId']
            )
            print("  ✅ Aborted.")
            
    except Exception as e:
        print(f"❌ Error cleaning {version}: {e}")

if __name__ == "__main__":
    cleanup_bucket("V1")
    cleanup_bucket("V2")
    cleanup_bucket("V3")
