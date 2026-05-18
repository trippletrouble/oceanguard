import asyncio
import websockets
import json
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
from app.services.obis_service import obis_service

load_dotenv()

class AISService:
    
    def __init__(self):
        self.api_key = ***ENTFERNT***"AISSTREAM_API_KEY")
        self.vessel_cache: dict[int, dict] = {}
        self.ais_connected: bool = False
        self.last_ais_message_at: datetime | None = None

    #AIS Stream Connection
    async def connect_ais_stream(self):
        URL = "wss://stream.aisstream.io/v0/stream"
        
        if self.api_key == "dein-aisstream-key-hier" or not self.api_key:
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
                    self.ais_connected = True
                    
                    subscribe_message = {"APIKey": self.api_key,
                                        "BoundingBoxes": self.get_all_bboxes(),
                                        "FilterMessageTypes": ["PositionReport"]}
                    subscribe_message_json = json.dumps(subscribe_message)
                    await websocket.send(subscribe_message_json)
                    print("Subscribed to AIS stream")

                    async for message_json in websocket:
                        self.last_ais_message_at = datetime.now(timezone.utc)
                        
                        message = json.loads(message_json)
                        await self.handle_message(message)

            except Exception as e:
                self.ais_connected = False
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

    def get_all_bboxes(self) -> list[list]:
        bboxes = []
        month = datetime.now().month

        for species_id in obis_service.SPECIES_CONFIG.keys():
            zones = obis_service.get_zones(species_id)
            if not zones:
                continue

            zone = zones.get(month)
            if not zone:
                continue

            center = zone.get("center")
            if not center:
                continue

            radius_km = zone.get("radius_km", 200)
            buffer = radius_km / 111
            lat = center["lat"]
            lng = center["lng"]
            bboxes.append([
                [lat - buffer, lng - buffer],
                [lat + buffer, lng + buffer]
            ])

        return bboxes if bboxes else [[[30, -10], [50, 40]]]

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

    #Cache Filtering
    def vessel_in_bbox(self, vessel: dict, bbox: list[list]) -> bool:
        lat = vessel.get("lat")
        lng = vessel.get("lng")

        if lat is None or lng is None:
            return False

        min_lat, min_lng = bbox[0]
        max_lat, max_lng = bbox[1]

        return (
            min_lat <= lat <= max_lat and
            min_lng <= lng <= max_lng
        )
    
    def get_vessels_for_species(self, species_id: str):
        month = datetime.now().month

        zones = obis_service.get_zones(species_id)
        if not zones:
            print(f"[DEBUG] Unknown species or no OBIS zones: {species_id}")
            return []

        zone = zones.get(month)
        if not zone:
            print(f"[DEBUG] No zone for current month ({month}) for species: {species_id}")
            return []

        center = zone.get("center")
        if not center:
            return []
        
        radius_km = zone.get("radius_km", 200)
        buffer = radius_km / 111
        bbox = [
            [center["lat"] - buffer, center["lng"] - buffer],
            [center["lat"] + buffer, center["lng"] + buffer]
        ]
        
        print(f"[DEBUG] Filtering species: {species_id}")
        print(f"[DEBUG] Using bbox(OBIS): {bbox}")
        
        vessels = []

        for vessel in self.vessel_cache.values():
            if self.vessel_in_bbox(vessel, bbox):
                vessels.append(vessel)

        print(f"[DEBUG] Total matched: {len(vessels)}")

        return vessels


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