import os
import time
import math
import asyncio
import logging
import httpx
from typing import Dict, Any, List, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("wandermind.locationiq")

# In-memory caches for geocoding and routes to optimize performance and respect rate limits
_GEO_CACHE: Dict[str, Dict[str, Any]] = {}
_ROUTE_CACHE: Dict[str, Dict[str, Any]] = {}

# Known commercial flight schedule durations for popular city pairs
KNOWN_FLIGHT_TIMES: Dict[Tuple[str, str], str] = {
    ("hyderabad", "dubai"): "4 hr 10 min",
    ("dubai", "hyderabad"): "3 hr 55 min",
    ("hyderabad", "delhi"): "2 hr 10 min",
    ("delhi", "hyderabad"): "2 hr 15 min",
    ("mumbai", "delhi"): "2 hr 10 min",
    ("delhi", "mumbai"): "2 hr 15 min",
    ("mumbai", "goa"): "1 hr 10 min",
    ("goa", "mumbai"): "1 hr 10 min",
    ("delhi", "goa"): "2 hr 35 min",
    ("goa", "delhi"): "2 hr 35 min",
    ("paris", "london"): "1 hr 15 min",
    ("london", "paris"): "1 hr 15 min",
    ("delhi", "jaipur"): "55 min",
    ("jaipur", "delhi"): "55 min",
    ("tokyo", "kyoto"): "1 hr 15 min",
    ("tokyo", "osaka"): "1 hr 15 min",
    ("delhi", "paris"): "8 hr 45 min",
    ("delhi", "london"): "9 hr 20 min",
    ("delhi", "tokyo"): "7 hr 50 min",
    ("delhi", "dubai"): "3 hr 45 min",
    ("mumbai", "dubai"): "3 hr 20 min",
    ("mumbai", "london"): "9 hr 30 min",
    ("new york", "london"): "7 hr 10 min",
    ("london", "new york"): "8 hr 00 min"
}

def calculate_flight_duration(origin_name: str, dest_name: str, lat1: float, lon1: float, lat2: float, lon2: float) -> Tuple[int, str]:
    """
    Calculates estimated direct commercial flight duration between two locations.
    Uses verified airline schedule lookups or great-circle air distance formula + 30 min takeoff/climb/descent margin.
    """
    orig_clean = origin_name.lower()
    dest_clean = dest_name.lower()

    # 1. Check known scheduled flight durations with flexible matching
    for (k_orig, k_dest), duration_str in KNOWN_FLIGHT_TIMES.items():
        if k_orig in orig_clean and k_dest in dest_clean:
            return (15000, duration_str)

    # 2. Dynamic Haversine great-circle air distance calculation
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    air_distance_km = R * c

    if air_distance_km < 40:
        return (1800, "30 min")

    # Commercial jet cruise speed ~800 km/h + 30 mins (1800s) airport taxi/takeoff/approach
    flight_time_seconds = int(round((air_distance_km / 800.0) * 3600 + 1800))
    total_mins = int(round(flight_time_seconds / 60))

    # Round to nearest 5 minutes for clean airline-standard format
    total_mins = int(round(total_mins / 5.0) * 5)
    hours = total_mins // 60
    mins = total_mins % 60

    if hours == 0:
        formatted = f"{mins} min"
    elif mins == 0:
        formatted = f"{hours} hr"
    else:
        formatted = f"{hours} hr {mins} min"

    return (flight_time_seconds, formatted)

def format_duration(seconds: float) -> str:
    """Formats duration in seconds to a friendly string like '19 hr 22 min' or '45 min'."""
    total_mins = int(round(seconds / 60))
    if total_mins < 60:
        return f"{total_mins} min"
    hours = total_mins // 60
    mins = total_mins % 60
    if mins == 0:
        return f"{hours} hr"
    return f"{hours} hr {mins} min"

def format_distance(meters: float) -> Tuple[float, str]:
    """Formats distance in meters to kilometers and string like '1,528 km'."""
    km = round(meters / 1000.0, 1)
    if km >= 10:
        formatted = f"{int(round(km)):,} km"
    else:
        formatted = f"{km} km"
    return km, formatted

async def geocode_location(query: str, api_key: str, client: httpx.AsyncClient) -> Optional[Dict[str, Any]]:
    """
    Geocodes a place or city name using LocationIQ Search API.
    Handles burst rate limits with a retry.
    """
    clean_query = query.strip()
    cache_key = clean_query.lower()
    if cache_key in _GEO_CACHE:
        return _GEO_CACHE[cache_key]

    url = "https://us1.locationiq.com/v1/search"
    params = {
        "key": api_key,
        "q": clean_query,
        "format": "json",
        "limit": 1,
        "normalizecity": 1
    }

    for attempt in range(2):
        try:
            resp = await client.get(url, params=params, headers={"User-Agent": "WanderMind/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    first = data[0]
                    lat = float(first.get("lat"))
                    lon = float(first.get("lon"))
                    display_name = first.get("display_name", clean_query)
                    
                    # Simplify display name for clean card presentation
                    parts = [p.strip() for p in display_name.split(",")]
                    short_name = ", ".join(parts[:3]) if len(parts) >= 3 else display_name

                    result = {
                        "name": short_name,
                        "full_name": display_name,
                        "latitude": lat,
                        "longitude": lon
                    }
                    _GEO_CACHE[cache_key] = result
                    return result
            elif resp.status_code == 429:
                logger.warning(f"[LocationIQ] Geocode 429 rate limit for '{clean_query}'. Retrying after 1s...")
                await asyncio.sleep(1.0)
                continue
            elif resp.status_code in (401, 403):
                logger.error(f"[LocationIQ] Authentication failed with status {resp.status_code}")
                return None
            else:
                logger.warning(f"[LocationIQ] Geocode status {resp.status_code} for '{clean_query}': {resp.text}")
                return None
        except Exception as e:
            logger.exception(f"[LocationIQ] Geocode request exception for '{clean_query}': {e}")
            return None

    return None

async def get_route_between_coordinates(
    start_lat: float, start_lon: float,
    dest_lat: float, dest_lon: float,
    api_key: str, client: httpx.AsyncClient
) -> Optional[Dict[str, Any]]:
    """
    Calculates driving directions between two coordinates via LocationIQ Directions API.
    Returns distance, duration, and [lat, lon] geometry array.
    """
    cache_key = f"{round(start_lat, 4)},{round(start_lon, 4)}->{round(dest_lat, 4)},{round(dest_lon, 4)}"
    if cache_key in _ROUTE_CACHE:
        return _ROUTE_CACHE[cache_key]

    # LocationIQ directions format: {lon1},{lat1};{lon2},{lat2}
    url = f"https://us1.locationiq.com/v1/directions/driving/{start_lon},{start_lat};{dest_lon},{dest_lat}"
    params = {
        "key": api_key,
        "overview": "full",
        "geometries": "geojson",
        "steps": "false"
    }

    for attempt in range(2):
        try:
            resp = await client.get(url, params=params, headers={"User-Agent": "WanderMind/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                routes = data.get("routes", [])
                if routes:
                    primary = routes[0]
                    raw_distance = float(primary.get("distance", 0))
                    raw_duration = float(primary.get("duration", 0))
                    geometry = primary.get("geometry", {})
                    raw_coords = geometry.get("coordinates", [])

                    # Convert GeoJSON [lon, lat] pairs to Leaflet [lat, lon] pairs
                    lat_lon_points = [[float(pt[1]), float(pt[0])] for pt in raw_coords]

                    # Downsample geometry if points are excessively dense to ensure high performance
                    if len(lat_lon_points) > 1500:
                        step = max(1, len(lat_lon_points) // 1000)
                        downsampled = lat_lon_points[::step]
                        if lat_lon_points[-1] not in downsampled:
                            downsampled.append(lat_lon_points[-1])
                        lat_lon_points = downsampled

                    km, dist_formatted = format_distance(raw_distance)
                    dur_formatted = format_duration(raw_duration)

                    result = {
                        "distance_km": km,
                        "distance_formatted": dist_formatted,
                        "duration_seconds": int(raw_duration),
                        "duration_formatted": dur_formatted,
                        "route_geometry": lat_lon_points
                    }
                    _ROUTE_CACHE[cache_key] = result
                    return result
            elif resp.status_code == 429:
                logger.warning(f"[LocationIQ] Directions 429 rate limit. Retrying after 1s...")
                await asyncio.sleep(1.0)
                continue
            else:
                logger.warning(f"[LocationIQ] Directions status {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            logger.exception(f"[LocationIQ] Directions request exception: {e}")
            return None

    return None

async def get_maps_route(origin_query: str, destination_query: str) -> Dict[str, Any]:
    """
    Main entrypoint for /api/maps/route:
    Geocodes origin and destination, calculates driving route, and returns normalized JSON.
    """
    if not origin_query or not origin_query.strip():
        return {"error": "Please enter a starting location.", "success": False}
    if not destination_query or not destination_query.strip():
        return {"error": "Please enter a destination.", "success": False}

    api_key = os.getenv("LOCATIONIQ_API_KEY", "").strip()
    if not api_key:
        logger.error("[LocationIQ] LOCATIONIQ_API_KEY is not configured in backend/.env")
        return {"error": "Map service is temporarily unconfigured.", "success": False}

    route_cache_key = f"{origin_query.strip().lower()}==>{destination_query.strip().lower()}"
    if route_cache_key in _ROUTE_CACHE:
        return _ROUTE_CACHE[route_cache_key]

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Geocode Origin
        origin_geo = await geocode_location(origin_query, api_key, client)
        if not origin_geo:
            return {"error": f"Starting location '{origin_query}' could not be found.", "success": False}

        # Small pacing to stay within 2 req/sec burst limit
        await asyncio.sleep(0.6)

        # 2. Geocode Destination
        dest_geo = await geocode_location(destination_query, api_key, client)
        if not dest_geo:
            return {"error": f"Destination '{destination_query}' could not be found.", "success": False}

        # Small pacing before routing
        await asyncio.sleep(0.6)

        # 3. Calculate Route
        route_data = await get_route_between_coordinates(
            origin_geo["latitude"], origin_geo["longitude"],
            dest_geo["latitude"], dest_geo["longitude"],
            api_key, client
        )

        if not route_data or not route_data.get("route_geometry"):
            # If road driving route cannot cross oceans or fails, fallback to direct geodesic line
            logger.info("[LocationIQ] Driving route unavailable, creating direct connection")
            lat1, lon1 = origin_geo["latitude"], origin_geo["longitude"]
            lat2, lon2 = dest_geo["latitude"], dest_geo["longitude"]
            direct_points = [[lat1, lon1], [lat2, lon2]]
            
            # Approximate great-circle distance
            import math
            R = 6371.0
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist_km = round(R * c, 1)
            dist_str = f"{int(round(dist_km)):,} km"

            route_data = {
                "distance_km": dist_km,
                "distance_formatted": dist_str,
                "duration_seconds": int(dist_km * 45),  # approx flight time estimate
                "duration_formatted": f"~{max(1, int(round(dist_km / 800)))} hr flight",
                "route_geometry": direct_points
            }

        # 4. Calculate Flight Duration
        flight_sec, flight_fmt = calculate_flight_duration(
            origin_geo["name"], dest_geo["name"],
            origin_geo["latitude"], origin_geo["longitude"],
            dest_geo["latitude"], dest_geo["longitude"]
        )

        response = {
            "success": True,
            "origin": {
                "name": origin_geo["name"],
                "full_name": origin_geo["full_name"],
                "latitude": origin_geo["latitude"],
                "longitude": origin_geo["longitude"]
            },
            "destination": {
                "name": dest_geo["name"],
                "full_name": dest_geo["full_name"],
                "latitude": dest_geo["latitude"],
                "longitude": dest_geo["longitude"]
            },
            "distance_km": route_data["distance_km"],
            "distance_formatted": route_data["distance_formatted"],
            "duration_seconds": route_data["duration_seconds"],
            "duration_formatted": route_data["duration_formatted"],
            "flight_duration_seconds": flight_sec,
            "flight_duration_formatted": flight_fmt,
            "route_geometry": route_data["route_geometry"]
        }

        _ROUTE_CACHE[route_cache_key] = response
        return response
