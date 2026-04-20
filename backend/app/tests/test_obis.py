from app.services.obis_service import OBISService

def test_tuna_connection():
    service = OBISService()
    print("Connecting to OBIS for Red Tuna data...")
    
    results = service.fetch_sightings("Thunnus thynnus")
    
    if results:
        print(f"Success! Found {len(results)} sightings.")
        first = results[0]
        print(f"Sample Location: Lat {first.get('decimalLatitude')}, Lng {first.get('decimalLongitude')}")
    else:
        print("No data found or connection failed.")

if __name__ == "__main__":
    test_tuna_connection()
