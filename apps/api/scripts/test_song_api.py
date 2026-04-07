import requests

def test_song_details(slug):
    url = f"http://localhost:8000/stats/song/{slug}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data:
                print(f"✅ Success! Found: {data.get('title')}")
                print(f"Artist: {data.get('artist')}")
                print(f"Versions: {len(data.get('versions', []))}")
                print(f"Total Revenue: {data.get('total_revenue')}")
            else:
                print("❌ Success but empty response (Not Found).")
        else:
            print(f"❌ Failed! Status Code: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_song_details("frio-do-inverno")
