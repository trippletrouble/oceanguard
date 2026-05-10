import asyncio
import websockets
import json
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

class AISService:
    
    def __init__(self):
        self.api_key = ***ENTFERNT***"AISSTREAM_API_KEY")
        self.vessel_cache: dict[int, dict] = {}

    #AIS Stream Connection
    async def connect_ais_stream(self):
        URL = "wss://stream.aisstream.io/v0/stream"
        if self.api_key == "dein-aisstream-key-hier":
            print("API Key missing, update in .env")
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
                                        "BoundingBoxes": [[[35, -10], [45, 20]]],
                                        "FilterMessageTypes": ["PositionReport"]}
                    subscribe_message_json = json.dumps(subscribe_message)
                    await websocket.send(subscribe_message_json)
                    print("Subscribed to AIS stream")

                    async for message_json in websocket:
                        message = json.loads(message_json)
                        await self.handle_message(message)
                        
                        # position = message["Message"]["PositionReport"]
                        # meta = message.get("MetaData", {})
                        # print(f"[{datetime.now(timezone.utc)}] ShipId: {meta.get("MMSI")} ShipName: {meta.get("ShipName")} Latitude: {position.get('Latitude')} Longitude: {position.get('Longitude')}")

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
            "speed": position.get("Sog"),
            "cog": position.get("Cog"),
        }

        self.vessel_cache[mmsi] = vessel       

        self.log_vessel(mmsi)


    #Cache Helpers
    def update_vessel_cache(self, mmsi: int, vessel_data: dict):

        vessel = self.vessel_cache.get(mmsi, {"mmsi": mmsi})

        vessel.update(vessel_data)

        vessel["last_update"] = datetime.now(timezone.utc).isoformat()

        self.vessel_cache[mmsi] = vessel
    
    def get_all_vessels(self):
        return list(self.vessel_cache.values())
    
    def get_vessel(self, mmsi: int):
        return self.vessel_cache.get(mmsi)
    
    def log_vessel(self, mmsi: int):
        vessel = self.vessel_cache.get(mmsi)
        
        if not vessel:
            return
        
        print(
            f"{vessel.get('name', 'Unknown')}  |  {vessel.get('lat', 'N/A')}, {vessel.get('lng', 'N/A')}  |  {vessel.get('speed', 'N/A')} kn"
        )
    
ais_service = AISService()