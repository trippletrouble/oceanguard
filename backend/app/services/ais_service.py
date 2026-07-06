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
        self.vessel_type_cache: dict[int, int] = {}
        self.vessel_name_cache: dict[int, str] = {}
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

                bboxes = await self.get_all_bboxes()

                async with websockets.connect(
                    URL,
                    ping_interval=20,
                    ping_timeout=20
                ) as websocket:
                    self.ais_connected = True
                    
                    subscribe_message = {"APIKey": self.api_key,
                                        "BoundingBoxes": bboxes,
                                        "FilterMessageTypes": [
                                            "PositionReport",
                                            "StaticDataReport",
                                            "ShipStaticData",
                                            "ExtendedClassBPositionReport",
                                        ]}
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
        meta = message.get("MetaData", {})

        if message_type == "ShipStaticData":
            static_data = message.get("Message", {}).get("ShipStaticData", {})
            mmsi = meta.get("MMSI") or static_data.get("UserID")
            if not mmsi:
                return

            mmsi = int(mmsi)
            parsed_type = self.parse_ship_type(static_data.get("Type"))
            if parsed_type is not None:
                self.vessel_type_cache[mmsi] = parsed_type

            ship_name = static_data.get("Name") or meta.get("ShipName")
            if ship_name:
                self.vessel_name_cache[mmsi] = ship_name.strip()

            self.update_cached_vessel_metadata(mmsi, parsed_type, ship_name, "ship_static_data")
            return

        if message_type == "ExtendedClassBPositionReport":
            position = message.get("Message", {}).get("ExtendedClassBPositionReport", {})
            mmsi = meta.get("MMSI") or position.get("UserID")
            if not mmsi:
                return

            mmsi = int(mmsi)
            ship_type_code = self.parse_ship_type(position.get("Type"))
            if ship_type_code is not None:
                self.vessel_type_cache[mmsi] = ship_type_code

            ship_name = position.get("Name") or meta.get("ShipName") or self.vessel_name_cache.get(mmsi)
            if ship_name:
                ship_name = ship_name.strip()
                self.vessel_name_cache[mmsi] = ship_name

            self.cache_position_vessel(
                mmsi=mmsi,
                name=ship_name or "Unknown",
                ship_type_code=ship_type_code,
                classification_source="extended_class_b",
                position=position,
            )
            self.cleanup_old_vessels()
            return

        # Static Data Messages
        if message_type == "StaticDataReport":
            static_data = message.get("Message", {}).get("StaticDataReport", {})
            report_a = static_data.get("ReportA", {})
            report_b = static_data.get("ReportB", {})

            mmsi = meta.get("MMSI") or static_data.get("UserID")
            if not mmsi:
                return
            
            mmsi = int(mmsi)

            ship_type = None
            if report_b.get("Valid"):
                ship_type = report_b.get("ShipType")

            parsed_type = self.parse_ship_type(ship_type)
            if parsed_type is not None:
                self.vessel_type_cache[mmsi] = parsed_type

            ship_name = None
            if report_a.get("Valid"):
                ship_name = report_a.get("Name")

            ship_name = ship_name or meta.get("ShipName")

            if ship_name:
                self.vessel_name_cache[mmsi] = ship_name.strip()

            self.update_cached_vessel_metadata(mmsi, parsed_type, ship_name, "static_report")

            return
        
        if message_type != "PositionReport":
            return

        mmsi = meta.get("MMSI")
        if not mmsi:
            return

        mmsi = int(mmsi)
        
        position = message["Message"]["PositionReport"]
        meta_ship_type = self.parse_ship_type(meta.get("ShipType"))
        cached_ship_type = self.vessel_type_cache.get(mmsi)
        ship_type_code = meta_ship_type if meta_ship_type is not None else cached_ship_type
        nav_status = position.get("NavigationalStatus")

        if meta_ship_type is not None:
            classification_source = "position_metadata"
        elif cached_ship_type is not None:
            classification_source = "static_report"
        elif nav_status == 7:
            classification_source = "navigational_status"
        else:
            classification_source = "unknown"

        self.cache_position_vessel(
            mmsi=mmsi,
            name=self.vessel_name_cache.get(mmsi) or meta.get("ShipName") or "Unknown",
            ship_type_code=ship_type_code,
            classification_source=classification_source,
            position=position,
            force_category="Fishing" if nav_status == 7 and ship_type_code is None else None,
        )
        self.cleanup_old_vessels()

        #self.log_vessel(mmsi)

    async def get_all_bboxes(self) -> list[list]:
        bboxes = []
        month = datetime.now().month

        for species_id in obis_service.SPECIES_CONFIG.keys():
            zones = obis_service.get_zones(species_id)
            if not zones:
                continue

            month_zones = zones.get(month, [])
            for zone in month_zones:
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

    def cache_position_vessel(
        self,
        mmsi: int,
        name: str,
        ship_type_code: int | None,
        classification_source: str,
        position: dict,
        force_category: str | None = None,
    ):
        category = force_category or self.classify_ship_type(ship_type_code)

        vessel = {
            "mmsi": mmsi,
            "name": name,
            "shiptype": ship_type_code,
            "category": category,
            "is_public": category in {"Fishing", "Unknown"},
            "classification_source": classification_source,
            "lat": position.get("Latitude"),
            "lng": position.get("Longitude"),
            "sog": position.get("Sog"),
            "cog": position.get("Cog"),
            "last_update": datetime.now(timezone.utc).isoformat()
        }

        self.vessel_cache[mmsi] = vessel

    def update_cached_vessel_metadata(
        self,
        mmsi: int,
        parsed_type: int | None,
        ship_name: str | None,
        classification_source: str,
    ):
        if mmsi not in self.vessel_cache:
            return

        vessel = self.vessel_cache[mmsi]

        if parsed_type is not None:
            vessel["shiptype"] = parsed_type
            vessel["category"] = self.classify_ship_type(parsed_type)
            vessel["is_public"] = vessel["category"] in {"Fishing", "Unknown"}
            vessel["classification_source"] = classification_source

        if ship_name:
            vessel["name"] = ship_name.strip()
    
    def parse_ship_type(self, value):
        try:
            return int(value)
        except (ValueError, TypeError):
            return None
        
    def classify_ship_type(self, ship_type: int | None) -> str:
        if ship_type is None:
            return "Unknown"
        elif ship_type == 30:
            return "Fishing"
        elif ship_type in {0, 99}:
            return "Unknown"
        elif ship_type in {36, 37}:
            return "Pleasure"
        elif 60 <= ship_type <= 69:
            return "Passenger"
        elif 70 <= ship_type <= 79:
            return "Cargo"
        elif 80 <= ship_type <= 89:
            return "Tanker"
        elif 50<= ship_type <= 59:
            return "Special_Craft"
        else:
            return "Other"
        
    def should_expose_vessel(self, vessel: dict) -> bool:
        return vessel.get("category") in {"Fishing", "Unknown"}
    
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

    async def get_vessels_for_species(self, species_id: str):
        month = datetime.now().month

        zones = obis_service.get_zones(species_id)
        if not zones:
            print(f"[DEBUG] Unknown species or no OBIS zones: {species_id}")
            return []

        month_zones = zones.get(month, [])
        if not month_zones:
            print(f"[DEBUG] No zones for current month ({month}) for species: {species_id}")
            return []

        print(f"[DEBUG] Filtering species: {species_id}")
        print(f"[DEBUG] Found {len(month_zones)} cluster center(s) for month {month}")

        matched_vessels = {}

        # Loop through each calculated cluster center for this month
        for idx, zone in enumerate(month_zones, start=1):
            center = zone.get("center")
            if not center:
                continue

            radius_km = zone.get("radius_km", 200)
            buffer = radius_km / 111
            bbox = [
                [center["lat"] - buffer, center["lng"] - buffer],
                [center["lat"] + buffer, center["lng"] + buffer]
            ]

            print(f"  [DEBUG] Center #{idx}: {center}")
            print(f"  [DEBUG] Using bbox(OBIS): {bbox}")

            cluster_match_count = 0
            for vessel in self.get_all_vessels():
                if self.vessel_in_bbox(vessel, bbox):
                    matched_vessels[vessel["mmsi"]] = vessel
                    cluster_match_count += 1

            print(f"  [DEBUG] Cluster #{idx} matched {cluster_match_count} vessels inside its bbox")

        print(f"[DEBUG] Total unique matched vessels across all clusters: {len(matched_vessels)}")

        return list(matched_vessels.values())

    #Cache-Cleanup
    def cleanup_old_vessels(self):
        now = datetime.now(timezone.utc)
        expired = []

        for mmsi, vessel in self.vessel_cache.items():
            last_update = datetime.fromisoformat(vessel["last_update"])
            if now - last_update > timedelta(minutes=5):
                expired.append(mmsi)

        for mmsi in expired:
            del self.vessel_cache[mmsi]


ais_service = AISService()
