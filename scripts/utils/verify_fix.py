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

def test_endpoints(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n1. Testing /tracks/grouped (Songs Page)...")
    try:
        res = requests.get(f"{BASE_URL}/tracks/grouped", headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print(f"Success! Got {len(res.json())} groups.")
        else:
            print(f"Failed: {res.text}")
    except Exception as e:
        print(f"Error testing grouped: {e}")

    print("\n2. Testing /tracks/search?q=test (Search)...")
    try:
        res = requests.get(f"{BASE_URL}/tracks/search", params={"q": "test"}, headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print(f"Success! Got {len(res.json())} results.")
        else:
            print(f"Failed: {res.text}")
    except Exception as e:
        print(f"Error testing search: {e}")

if __name__ == "__main__":
    token = get_token()
    if token:
        test_endpoints(token)
