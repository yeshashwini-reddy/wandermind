import os
import requests
from typing import Dict, Any

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

def get_destination_weather(destination_name: str, lat: float = None, lng: float = None) -> Dict[str, Any]:
    """
    Fetches real-time weather from OpenWeather API if key is available.
    Otherwise returns realistic seasonal mock data with `is_demo_data=True`.
    """
    if OPENWEATHER_API_KEY and OPENWEATHER_API_KEY != "your_openweather_key_here":
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={destination_name},IN&units=metric&appid={OPENWEATHER_API_KEY}"
            if lat and lng:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&units=metric&appid={OPENWEATHER_API_KEY}"
            
            resp = requests.get(url, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "temp": round(data["main"]["temp"]),
                    "condition": data["weather"][0]["main"],
                    "description": data["weather"][0]["description"].title(),
                    "humidity": data["main"]["humidity"],
                    "wind_speed": round(data["wind"]["speed"] * 3.6),
                    "icon": data["weather"][0]["icon"],
                    "is_demo_data": False,
                    "source": "OpenWeather Real-Time API"
                }
        except Exception:
            pass # Fall through to fallback mock
    
    # Fallback mock weather map
    defaults = {
        "goa": {"temp": 28, "condition": "Sunny", "description": "Pleasant Coastal Breeze", "humidity": 68, "wind_speed": 12},
        "jaipur": {"temp": 25, "condition": "Clear", "description": "Warm & Sunny Heritage Sky", "humidity": 42, "wind_speed": 9},
        "munnar": {"temp": 18, "condition": "Misty", "description": "Cool Mountain Mist", "humidity": 80, "wind_speed": 6},
        "manali": {"temp": 12, "condition": "Chilly", "description": "Crisp Himalayan Breezes", "humidity": 55, "wind_speed": 10},
        "hampi": {"temp": 27, "condition": "Breezy", "description": "Sunny Granite Terrains", "humidity": 38, "wind_speed": 14},
        "varanasi": {"temp": 24, "condition": "Hazy", "description": "Mild Sacred River Breeze", "humidity": 52, "wind_speed": 8},
        "coorg": {"temp": 21, "condition": "Overcast", "description": "Fresh Coffee Estate Air", "humidity": 76, "wind_speed": 8},
        "andaman": {"temp": 29, "condition": "Tropical", "description": "Azure Skies & Ocean Breeze", "humidity": 72, "wind_speed": 15}
    }
    
    key = destination_name.lower().split()[0]
    data = defaults.get(key, {"temp": 26, "condition": "Pleasant", "description": "Mild and Sunny", "humidity": 55, "wind_speed": 10})
    
    return {
        "temp": data["temp"],
        "condition": data["condition"],
        "description": data["description"],
        "humidity": data["humidity"],
        "wind_speed": data["wind_speed"],
        "icon": "01d",
        "is_demo_data": True,
        "source": "Simulated Weather Engine (Demo Data)"
    }
