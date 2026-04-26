import httpx
import asyncio

API_KEY = "***ENTFERNT***" # Dein Key!
EMAIL = "naren@test.de"
PASSWORD = "***ENTFERNT***"

async def get_firebase_token():
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "returnSecureToken": True
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        data = response.json()
        
        if "idToken" in data:
            print("\n✅ DEIN TOKEN (kopiere alles ab hier):\n")
            print(data["idToken"])
            print("\n")
        else:
            print("❌ Fehler:", data)

asyncio.run(get_firebase_token())