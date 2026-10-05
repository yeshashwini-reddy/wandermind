import requests
import json
import os
from typing import List, Dict, Any

def search_nearby_places(query: str, lat: float, lng: float, radius_km: float = 5.0) -> List[Dict[str, Any]]:
    """
    Queries OpenStreetMap Nominatim for POIs or uses rich fallback POIs.
    """
    try:
        headers = {"User-Agent": "WanderMind-AIAgent-Planner/1.0"}
        url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5&bounded=1&viewbox={lng-0.1},{lat+0.1},{lng+0.1},{lat-0.1}"
        resp = requests.get(url, headers=headers, timeout=2)
        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                results = []
                for item in data[:3]:
                    results.append({
                        "name": item.get("display_name", "").split(",")[0],
                        "lat": float(item.get("lat")),
                        "lng": float(item.get("lon")),
                        "category": item.get("type", "Sightseeing"),
                        "is_demo_data": False,
                        "source": "OpenStreetMap Real-Time API"
                    })
                return results
    except Exception:
        pass
    
    # Fallback to smart local POIs
    return [
        {
            "name": f"Famous {query.title()} Heritage Center",
            "lat": lat + 0.005,
            "lng": lng + 0.005,
            "category": "Curated POI",
            "is_demo_data": True,
            "source": "WanderMind Curated POI Engine"
        }
    ]
