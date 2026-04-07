
import requests

API_KEY = "-Ba5v2ACVOos-1p4qRepa1IMAQSt6p9unkEvSDRs4sM4hOplO8WsuVtsm49xO3u7"
BASE_URLS = [
    "https://api.assinafy.com.br",
    "https://api.assinafy.com.br/v1",
    "https://app.assinafy.com.br/api",
    "https://app.assinafy.com.br/api/v1"
]

ENDPOINTS = [
    "/documents",
    "/templates",
    "/user",
    "/account",
    "/me"
]

def test_endpoints():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Try also with x-api-key just in case
    headers_alt = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    }

    print(f"Testing API Key: {API_KEY[:5]}...")

    for base in BASE_URLS:
        print(f"\n--- Testing Base URL: {base} ---")
        for endpoint in ENDPOINTS:
            url = f"{base}{endpoint}"
            try:
                # Test Bearer Token
                resp = requests.get(url, headers=headers, timeout=5)
                print(f"GET {url} [Bearer]: {resp.status_code}")
                if resp.status_code == 200:
                    print(f"SUCCESS! Response: {resp.json()}")
                    return
                
                # Test x-api-key
                # resp_alt = requests.get(url, headers=headers_alt, timeout=5)
                # print(f"GET {url} [ApiKey]: {resp_alt.status_code}")
                # if resp_alt.status_code == 200:
                #     print(f"SUCCESS! Response: {resp_alt.json()}")
                #     return

            except Exception as e:
                print(f"Error connecting to {url}: {e}")

if __name__ == "__main__":
    test_endpoints()
