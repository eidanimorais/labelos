import requests
try:
    url = "http://127.0.0.1:8000/auth/login"
    data = {"username": "admin", "password": "@Mariana1998"}
    response = requests.post(url, data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
