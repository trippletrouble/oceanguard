from math import radians, cos, sin, asin, sqrt

def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371 # Radius of earth in kilometers

    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    
    return c * r
