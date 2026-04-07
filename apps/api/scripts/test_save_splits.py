
import requests
import json

BASE_URL = "http://localhost:8000"

def test_save_splits():
    track_id = 1 # Succubus 2
    payload = [
        {
            "participant_name": "GRAV",
            "role": "ARTISTA",
            "percentage": 60.0
        }
    ]
    
    print(f"Testing POST /splits/{track_id}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(f"{BASE_URL}/splits/{track_id}", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_save_splits()
