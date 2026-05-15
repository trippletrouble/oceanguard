import httpx
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

# --- KONFIGURATION ---
# WICHTIG: Das ist der Web API Key, NICHT der private Schlüssel aus der JSON!
# Du findest ihn in der Firebase Console unter Projekteinstellungen -> Allgemein -> Web-API-Schlüssel
API_KEY = ***ENTFERNT***"FIREBASE_API_KEY") 
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
        print(f"🔄 Logge ein bei Firebase für {EMAIL}...")
        response = await client.post(url, json=payload)
        data = response.json()
        
        if "idToken" in data:
            print("✅ Erfolgreich eingeloggt!\n")
            print("="*70)
            print("🔑 DEIN TOKEN FÜR SWAGGER/POSTMAN (Kopiere den kompletten Text inkl. 'Bearer'):\n")
            print(f"Bearer {data['idToken']}")
            print("="*70 + "\n")
            
            print("💡 So geht es weiter:")
            print("1. Kopiere den Token oben.")
            print("2. Füge ihn in Swagger oben rechts bei 'Authorize' ein.")
            print("3. Rufe einfach irgendeinen Endpunkt auf (z.B. /api/alerts).")
            print("4. Dein Backend erledigt den Datenbank-Sync dank Auto-Sync in Millisekunden von selbst!")
        else:
            print("❌ Fehler beim Login:")
            print(data)

if __name__ == "__main__":
    asyncio.run(get_firebase_token())