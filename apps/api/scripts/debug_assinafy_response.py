
import requests

API_KEY = "-Ba5v2ACVOos-1p4qRepa1IMAQSt6p9unkEvSDRs4sM4hOplO8WsuVtsm49xO3u7"
URLS_TO_TEST = [
    "https://api.assinafy.com.br/v1/documents",
    "https://app.assinafy.com.br/api/v1/documents",
    "https://api.assinafy.com.br/api/v1/documents" # Wild guess
]

def debug_responses():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }
    
    for url in URLS_TO_TEST:
        print(f"\n--- Testing {url} ---")
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            print(f"Status: {resp.status_code}")
            print(f"Content-Type: {resp.headers.get('Content-Type')}")
            print(f"Content Preview: {resp.text[:500]}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    debug_responses()
