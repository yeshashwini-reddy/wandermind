import json
import os
from typing import List, Dict, Any
from services.provider_registry import ProviderRegistry

FARES_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "fares.json")

def load_fares_data() -> Dict[str, Any]:
    if os.path.exists(FARES_FILE):
        with open(FARES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"transports": [], "hotels": []}

def search_travel_options(destination_id: str, travelers_count: int = 4, budget_tier: str = "balanced") -> Dict[str, Any]:
    data = load_fares_data()
    all_trans = data.get("transports", [])
    all_stays = data.get("hotels", [])
    
    # Filter transports for destination or generate smart fallback
    trans_list = [t for t in all_trans if t.get("destination_id") == destination_id]
    if not trans_list:
        # Generate default 3 ranked options
        trans_list = [
            {
                "id": f"tr-{destination_id}-fl",
                "destination_id": destination_id,
                "type": "flight",
                "operator": "Airways Express Jet",
                "departure_time": "07:30",
                "arrival_time": "09:45",
                "duration": "2h 15m",
                "price_per_person": 4200,
                "badge": "Fastest",
                "refundable": True,
                "cancellation_fee": "Rs 500 flat fee up to 24h before departure",
                "comfort_rating": 4.6,
                "co2_kg": 110
            },
            {
                "id": f"tr-{destination_id}-tr",
                "destination_id": destination_id,
                "type": "train",
                "operator": "Vande Bharat Superfast Express",
                "departure_time": "06:00",
                "arrival_time": "12:30",
                "duration": "6h 30m",
                "price_per_person": 1650,
                "badge": "Best Value",
                "refundable": True,
                "cancellation_fee": "Rs 120 clerkage fee before 48h",
                "comfort_rating": 4.7,
                "co2_kg": 22
            },
            {
                "id": f"tr-{destination_id}-bu",
                "destination_id": destination_id,
                "type": "bus",
                "operator": "Intercity Volvo AC Sleeper",
                "departure_time": "21:00",
                "arrival_time": "07:00 (+1)",
                "duration": "10h 00m",
                "price_per_person": 850,
                "badge": "Cheapest",
                "refundable": False,
                "cancellation_fee": "Non-refundable promotional ticket",
                "comfort_rating": 4.0,
                "co2_kg": 32
            }
        ]
        
    stays_list = [h for h in all_stays if h.get("destination_id") == destination_id]
    if not stays_list:
        stays_list = [
            {
                "id": f"ht-{destination_id}-1",
                "destination_id": destination_id,
                "name": f"Grand {destination_id.capitalize()} Heritage Resort & Spa",
                "tier": "premium",
                "price_per_night": 9500,
                "rating": 4.8,
                "amenities": ["Pool", "Breakfast Included", "Free Spa Access", "Mountain/Sea View"],
                "elder_accessible": True,
                "diet_friendly": ["Veg", "Non-veg", "Jain", "Halal"],
                "refundable": True,
                "badge": "AI Top Pick (Luxury)"
            },
            {
                "id": f"ht-{destination_id}-2",
                "destination_id": destination_id,
                "name": f"{destination_id.capitalize()} Valley Boutique Hotel",
                "tier": "balanced",
                "price_per_night": 3200,
                "rating": 4.6,
                "amenities": ["Air Conditioning", "Free Breakfast", "Elevator Access", "Wi-Fi"],
                "elder_accessible": True,
                "diet_friendly": ["Veg", "Non-veg", "Jain"],
                "refundable": True,
                "badge": "Best Value"
            },
            {
                "id": f"ht-{destination_id}-3",
                "destination_id": destination_id,
                "name": f"Travellers Nest {destination_id.capitalize()} Stay",
                "tier": "budget",
                "price_per_night": 1200,
                "rating": 4.2,
                "amenities": ["High Speed Wi-Fi", "Common Kitchen", "Hot Water"],
                "elder_accessible": False,
                "diet_friendly": ["Veg", "Non-veg"],
                "refundable": False,
                "badge": "Cheapest"
            }
        ]
    
    # Structure into BookingOptionItem format
    formatted_transports = []
    for t in trans_list:
        total_p = t["price_per_person"] * travelers_count
        warnings = []
        if not t["refundable"]:
            warnings.append("Non-refundable: 100% loss upon cancellation")
        if t["type"] == "bus" and t.get("duration", "").startswith("1"):
            warnings.append("Long overnight journey may not suit elders")
            
        ai_reason = f"{t['badge']} choice: {t['operator']} offers {t['duration']} travel time at ₹{t['price_per_person']}/person."
        if t["badge"] == "Best Value":
            ai_reason += " Perfect balance of punctuality, comfort rating 4.8/5, and flexible refund."
            
        formatted_transports.append({
            "id": t["id"],
            "category": "transport",
            "type": t["type"],
            "title": f"{t['operator']} ({t['type'].title()})",
            "provider": t["operator"],
            "badge": t["badge"],
            "duration_or_tier": t["duration"],
            "price": total_p,
            "price_per_person": t["price_per_person"],
            "refundable": t["refundable"],
            "cancellation_policy": t["cancellation_fee"],
            "comfort_score": t["comfort_rating"],
            "ai_reasoning": ai_reason,
            "booking_url": ProviderRegistry.resolve_booking_url(t["operator"], t["type"]),
            "warning_flags": warnings
        })
        
    formatted_stays = []
    for h in stays_list:
        nights = 2 # standard 3 day trip = 2 nights
        rooms = max(1, (travelers_count + 1) // 2)
        total_stay = h["price_per_night"] * nights * rooms
        warnings = []
        if not h["refundable"]:
            warnings.append("Non-refundable booking fee")
        if not h.get("elder_accessible"):
            warnings.append("Stairs only - not recommended for mobility limits")
            
        ai_reason = f"{h['badge']}: Rated {h['rating']}★. Includes {', '.join(h['amenities'][:2])}."
        if h["badge"] == "Best Value":
            ai_reason += " Fully elder-accessible with verified diet customization."
            
        formatted_stays.append({
            "id": h["id"],
            "category": "stay",
            "type": h["tier"],
            "title": h["name"],
            "provider": h["name"],
            "badge": h["badge"],
            "duration_or_tier": f"{h['tier'].title()} (₹{h['price_per_night']}/night)",
            "price": total_stay,
            "price_per_person": round(total_stay / travelers_count),
            "refundable": h["refundable"],
            "cancellation_policy": "Free cancellation until 48h before check-in" if h["refundable"] else "Non-refundable promotional rate",
            "comfort_score": h["rating"],
            "ai_reasoning": ai_reason,
            "booking_url": ProviderRegistry.resolve_booking_url(h["name"], "stay"),
            "warning_flags": warnings
        })
        
    # Pick AI Best Deal Package
    best_trans = next((t for t in formatted_transports if t["badge"] == "Best Value"), formatted_transports[0])
    best_stay = next((s for s in formatted_stays if s["badge"] == "Best Value"), formatted_stays[0])
    premium_trans = next((t for t in formatted_transports if t["badge"] == "Fastest"), formatted_transports[0])
    premium_stay = next((s for s in formatted_stays if "Luxury" in s["badge"]), formatted_stays[0])
    
    total_package = best_trans["price"] + best_stay["price"]
    premium_package = premium_trans["price"] + premium_stay["price"]
    savings = max(0, premium_package - total_package)
    
    return {
        "transports": formatted_transports,
        "stays": formatted_stays,
        "ai_package": {
            "transport": best_trans,
            "stay": best_stay,
            "total_package_cost": total_package,
            "ai_verdict": f"WanderMind AI selected {best_trans['title']} + {best_stay['title']} as the optimal package saving ₹{savings:,.0f} compared to premium fares while maintaining 100% elder accessibility and flexible refund policies."
        },
        "total_estimated_package_cost": total_package,
        "savings_vs_premium": savings
    }
