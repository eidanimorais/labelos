
import requests

API_KEY = "-Ba5v2ACVOos-1p4qRepa1IMAQSt6p9unkEvSDRs4sM4hOplO8WsuVtsm49xO3u7"
BASE_URL = "https://api.assinafy.com.br"

PATHS_TO_TEST = [
    "/v1/documents",
    "/v1/document",
    "/v1/contracts",
    "/v1/contract",
    "/v1/files",
    "/v1/folders",
    "/v1/envelopes",
    "/v1/signatures",
    "/v1/users",
    "/v1/account",
    "/v1/me",
    "/documents",
    "/contracts",
    "/api/documents",
    "/api/v1/documents"
]

def bruteforce_endpoints():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }
    
    print(f"Testing Base URL: {BASE_URL}")
    for path in PATHS_TO_TEST:
        url = f"{BASE_URL}{path}"
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            print(f"{resp.status_code} \t {url}")
            if resp.status_code != 404:
                print(f"--> POTENTIAL HIT! Content: {resp.text[:200]}")
        except Exception as e:
            print(f"Error {path}: {e}")

if __name__ == "__main__":
    bruteforce_endpoints()
