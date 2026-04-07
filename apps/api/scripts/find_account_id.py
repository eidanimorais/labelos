
import requests

API_KEY = "-Ba5v2ACVOos-1p4qRepa1IMAQSt6p9unkEvSDRs4sM4hOplO8WsuVtsm49xO3u7"
BASE_URL = "https://api.assinafy.com.br"

def find_account_id():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }
    
    # Potential endpoints to get account info
    endpoints = [
        "/v1/users/me",
        "/v1/me",
        "/v1/accounts",
        "/v1/user",
        "/v1/workspace"
    ]

    print(f"Testing API Key: {API_KEY[:5]}...")

    for endpoint in endpoints:
        url = f"{BASE_URL}{endpoint}"
        print(f"\nTesting {url}...")
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"Response: {resp.json()}")
                return resp.json()
            else:
                print(f"Response: {resp.text[:200]}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    find_account_id()
