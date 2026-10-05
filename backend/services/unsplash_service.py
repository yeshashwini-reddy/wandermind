import os
import time
import logging
import httpx
from typing import Dict, Any, List
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

logger = logging.getLogger("wandermind.unsplash")

# Short-lived in-memory cache to deduplicate requests and avoid rate limits
# Structure: { normalized_query: { "timestamp": float, "data": dict } }
_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 1800  # 30 minutes

KNOWN_DESTINATIONS = {
    "hyderabad": "Hyderabad Charminar India travel landmarks",
    "goa": "Goa beach India travel coastal",
    "delhi": "Delhi India Red Fort monuments travel",
    "mumbai": "Mumbai Gateway of India city skyline travel",
    "jaipur": "Jaipur Hawa Mahal Rajasthan India palace travel",
    "kerala": "Kerala backwaters Alleppey India travel",
    "manali": "Manali Himalayas Himachal India mountains travel",
    "kashmir": "Kashmir Dal Lake mountains India travel",
    "paris": "Paris Eiffel Tower France travel landmarks",
    "london": "London Big Ben UK travel landmarks",
    "tokyo": "Tokyo Japan travel cityscape landmarks",
    "dubai": "Dubai Burj Khalifa UAE skyline travel",
    "bali": "Bali Indonesia tropical temple beach travel",
    "singapore": "Singapore Marina Bay Sands travel landmarks",
    "rome": "Rome Colosseum Italy monuments travel",
    "switzerland": "Switzerland Alps mountains travel landscape",
    "new york": "New York City Manhattan skyline travel",
    "istanbul": "Istanbul Hagia Sophia Turkey travel landmarks",
    "bangkok": "Bangkok Thailand temple travel",
    "maldives": "Maldives island beach resort ocean travel",
}

def get_search_query(destination: str) -> str:
    cleaned = destination.strip().lower()
    for key, query in KNOWN_DESTINATIONS.items():
        if key in cleaned or cleaned in key:
            return query
    return f"{destination.strip()} travel landmarks"

async def fetch_destination_photos_from_unsplash(destination: str, count: int = 10) -> Dict[str, Any]:
    """
    Directly queries the Unsplash API Search Photos endpoint from FastAPI backend.
    Returns normalized photos with photographer attribution.
    """
    if not destination or not destination.strip():
        return {"destination": destination, "photos": []}

    normalized_dest = destination.strip()
    cache_key = f"{normalized_dest.lower()}_{count}"

    # Check cache
    now = time.time()
    if cache_key in _CACHE:
        entry = _CACHE[cache_key]
        if now - entry["timestamp"] < CACHE_TTL_SECONDS:
            return entry["data"]

    access_key = os.getenv("UNSPLASH_ACCESS_KEY", "").strip()
    if not access_key:
        logger.warning("[Unsplash] UNSPLASH_ACCESS_KEY is not configured in backend environment.")
        return {
            "destination": normalized_dest,
            "photos": [],
            "error": "UNSPLASH_ACCESS_KEY is not configured"
        }

    search_query = get_search_query(normalized_dest)
    per_page = max(1, min(count, 15))

    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": search_query,
        "page": 1,
        "per_page": per_page,
        "orientation": "landscape"
    }
    headers = {
        "Authorization": f"Client-ID {access_key}",
        "Accept-Version": "v1",
        "User-Agent": "WanderMind/1.0"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            
            if resp.status_code != 200:
                logger.error(f"[Unsplash API Error] Status {resp.status_code}: {resp.text}")
                return {
                    "destination": normalized_dest,
                    "photos": [],
                    "error": f"Unsplash API returned status {resp.status_code}"
                }

            data = resp.json()
            raw_results = data.get("results", [])

            photos: List[Dict[str, Any]] = []
            for item in raw_results:
                urls = item.get("urls", {})
                user = item.get("user", {})
                links = item.get("links", {})
                user_links = user.get("links", {})

                # UTM tags for Unsplash API attribution guidelines
                photographer_name = user.get("name") or user.get("username") or "Photographer"
                photographer_html = user_links.get("html") or f"https://unsplash.com/@{user.get('username', '')}"
                photographer_url = f"{photographer_html}?utm_source=wandermind&utm_medium=referral"
                
                photo_html = links.get("html") or f"https://unsplash.com/photos/{item.get('id')}"
                unsplash_url = f"{photo_html}?utm_source=wandermind&utm_medium=referral"

                image_url = urls.get("regular") or urls.get("small") or urls.get("full")
                thumb_url = urls.get("small") or urls.get("thumb") or urls.get("regular")
                description = item.get("alt_description") or item.get("description") or f"{normalized_dest} photography"

                if image_url:
                    photos.append({
                        "id": str(item.get("id")),
                        "imageUrl": image_url,
                        "thumbUrl": thumb_url,
                        "description": description.capitalize() if description else f"{normalized_dest} scenic view",
                        "photographer": photographer_name,
                        "photographerUrl": photographer_url,
                        "unsplashUrl": unsplash_url,
                        "width": item.get("width"),
                        "height": item.get("height"),
                        "color": item.get("color")
                    })

            result = {
                "destination": normalized_dest,
                "photos": photos
            }

            # Cache successful response
            _CACHE[cache_key] = {
                "timestamp": now,
                "data": result
            }

            return result

    except Exception as exc:
        logger.exception(f"[Unsplash Exception] Failed to search photos for '{normalized_dest}': {exc}")
        return {
            "destination": normalized_dest,
            "photos": [],
            "error": str(exc)
        }
