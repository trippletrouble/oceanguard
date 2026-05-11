import asyncio
import websockets
import json
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

SPECIES_BOUNDING_BOXES = {
    "thunnus-thynnus": [[30, -5], [46, 36]],
    "gadus-morhua": [[30, -5], [46, 36]],
    "sardina-pilchardus": [[45, -20], [70, 20]],
    "xiphias-gladius": [[35, -15], [60, 10]],
}

class AISService:
    
    def __init__(self):
        self.api_key = ***ENTFERNT***"AISSTREAM_API_KEY")
        self.vessel_cache: dict[int, dict] = {}
        self.active_species = None

    #AIS Stream Connection
    async def connect_ais_stream(self, species_id: str):
        URL = "wss://stream.aisstream.io/v0/stream"
        self.active_species = species_id
        
        if self.api_key == "dein-aisstream-key-hier" or not self.api_key:
            print("API Key missing, update in .env")
            return
        
        bbox = SPECIES_BOUNDING_BOXES.get(species_id)
        if not bbox:
            print(f"Unknown species: {species_id}")
            return

        while True:
            try:
                print("Connecting to AIS Stream.")

                async with websockets.connect(
                    URL,
                    ping_interval=20,
                    ping_timeout=20
                ) as websocket:
                    
                    subscribe_message = {"APIKey": self.api_key,
                                        "BoundingBoxes": [bbox],
                                        "FilterMessageTypes": ["PositionReport"]}
                    subscribe_message_json = json.dumps(subscribe_message)
                    await websocket.send(subscribe_message_json)
                    print("Subscribed to AIS stream")

                    async for message_json in websocket:
                        message = json.loads(message_json)
                        await self.handle_message(message)

            except Exception as e:
                print(f"AIS stream error: {e}")
                await asyncio.sleep(5)

    async def handle_message(self, message: dict):
        message_type = message.get("MessageType")

        if message_type != "PositionReport":
            return

        position = message["Message"]["PositionReport"]
        meta = message.get("MetaData", {})
        mmsi = meta.get("MMSI")

        vessel = {
            "mmsi": meta.get("MMSI"),
            "name": meta.get("ShipName") or "Unknown",
            "lat": position.get("Latitude"),
            "lng": position.get("Longitude"),
            "sog": position.get("Sog"),
            "cog": position.get("Cog"),
            "last_update": datetime.now(timezone.utc).isoformat()
        }

        self.vessel_cache[vessel["mmsi"]] = vessel
        self.cleanup_old_vessels()

        #self.log_vessel(mmsi)

    async def restart_stream(self, species_id: str):
        self.vessel_cache.clear()

        asyncio.create_task(
            self.connect_ais_stream(species_id)
        )

    #Cache Helpers    
    def get_all_vessels(self):
        return list(self.vessel_cache.values())
    
    def get_vessel(self, mmsi: int):
        return self.vessel_cache.get(mmsi)
    
    def log_vessel(self, mmsi: int):
        vessel = self.vessel_cache.get(mmsi)
        
        if not vessel:
            return
        
        print(
            f"{vessel.get('name', 'Unknown')}  |  {vessel.get('lat', 'N/A')}, {vessel.get('lng', 'N/A')}  |  {vessel.get('sog', 'N/A')} kn"
        )

    #Cache-Cleanup
    def cleanup_old_vessels(self):
        now = datetime.now(timezone.utc)
        expired = []

        for mmsi, vessel in self.vessel_cache.items():
            last_update = datetime.fromisoformat(vessel["last_update"])
            if now - last_update > timedelta(minutes=30):
                expired.append(mmsi)

        for mmsi in expired:
            del self.vessel_cache[mmsi]
    
    
ais_service = AISService()