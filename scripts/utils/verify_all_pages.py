import requests

BASE_URL = "http://127.0.0.1:8000"

def get_token():
    try:
        data = {"username": "admin", "password": "@Mariana1998"}
        response = requests.post(f"{BASE_URL}/auth/login", data=data)
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def verify_pages(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Artist Page (fuub)
    print("\n1. Testing Artist Page (fuub)...")
    try:
        res = requests.get(f"{BASE_URL}/artists/fuub", headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print("Success! Artist profile loaded.")
        else:
            print(f"Failed: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Splits Page - It uses /tracks to list tracks. We verified /tracks works.
    # We essentially verified this by removing the frontend filter, but let's just confirm /tracks returns items.
    print("\n2. Testing Tracks List (for Splits)...")
    try:
        res = requests.get(f"{BASE_URL}/tracks", headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            tracks = res.json()
            print(f"Success! Got {len(tracks)} tracks.")
            if len(tracks) > 0:
                print(f"Sample Status: {tracks[0].get('status')}")
        else:
            print(f"Failed: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    token = get_token()
    if token:
        verify_pages(token)
