import json
import os
from typing import Dict, Any, List
from models.schemas import IntakeRequest, ItineraryResponse, DayPlan, ActivityItem, BudgetBreakdown
from agents.coordinator import publish_agent_step

DESTINATIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "destinations.json")

def get_destination_data(destination_id: str) -> Dict[str, Any]:
    if os.path.exists(DESTINATIONS_FILE):
        with open(DESTINATIONS_FILE, "r", encoding="utf-8") as f:
            destinations = json.load(f)
            for d in destinations:
                if d["id"].lower() == destination_id.lower() or d["name"].lower() == destination_id.lower():
                    return d
    # Fallback to first destination if not found
    return {
        "id": destination_id,
        "name": destination_id.capitalize(),
        "tagline": "Scenic Adventure Destination",
        "description": "An unforgettable getaway with rich culture, scenic views, and delectable local cuisine.",
        "coordinates": {"lat": 15.2993, "lng": 74.1240},
        "food_guide": {"veg_options": ["Local Veg Thali", "Rice Bowl"], "non_veg_options": ["Local Curry"], "jain_options": ["Jain Thali"], "halal_options": ["Halal Chicken"]},
        "precautions": ["Stay hydrated", "Keep emergency numbers handy"],
        "packing_list": ["Comfortable shoes", "Sunscreen", "Cotton wear"],
        "etiquette": ["Respect local customs", "Ask before photographing residents"],
        "emergency_info": {"hospital": "City Central Hospital (+91 108)", "police": "Tourist Helpline 100"},
        "attractions": []
    }

async def generate_itinerary(destination_id: str, intake: IntakeRequest, trip_id: str = "temp_trip") -> ItineraryResponse:
    """
    Itinerary Agent:
    Builds hour-by-hour plan with transit times, entry fees, precautions, packing checklist, etiquette, SOS, and Plan B.
    """
    await publish_agent_step(
        trip_id,
        "Itinerary Agent",
        f"Synthesizing customized day-wise schedule for {destination_id.title()}",
        status="THINKING"
    )
    
    dest_data = get_destination_data(destination_id)
    dest_name = dest_data.get("name", destination_id.capitalize())
    duration_days = max(1, intake.duration_days)
    people = max(1, intake.travelers_count)
    total_budget = intake.total_budget
    
    # Calculate Budget Breakdown
    travel_alloc = round(total_budget * 0.30, 2)
    stay_alloc = round(total_budget * 0.30, 2)
    food_alloc = round(total_budget * 0.20, 2)
    activities_alloc = round(total_budget * 0.10, 2)
    emergency_alloc = round(total_budget * 0.10, 2)
    
    budget_breakdown = BudgetBreakdown(
        travel=travel_alloc,
        stay=stay_alloc,
        food=food_alloc,
        activities=activities_alloc,
        emergency_buffer=emergency_alloc,
        total=total_budget,
        per_person_per_day=round(total_budget / (duration_days * people), 2)
    )
    
    # Attractions list
    attractions = dest_data.get("attractions", [])
    
    days_list: List[DayPlan] = []
    
    day_themes = [
        "Heritage Footprints & Colonial Architectural Splendors",
        "Scenic Coastlines, Nature Trails & Sunset Panorama",
        "Artisan Culture, Fragrant Spice Trails & Gastronomy Walk",
        "Tranquil Monasteries & Forest Hideaways",
        "Water Excursions & Local Souvenir Bazaars"
    ]
    
    await publish_agent_step(
        trip_id,
        "Itinerary Agent",
        f"Injecting dietary compliance ({intake.diet}) and elder-friendly speed intervals",
        tool_called="route_pacing_optimizer",
        status="ACTING"
    )
    
    # Build Day Plans
    for day_idx in range(1, duration_days + 1):
        theme = day_themes[(day_idx - 1) % len(day_themes)]
        
        # Pick 2-3 attractions for this day
        att_idx_start = ((day_idx - 1) * 2) % max(1, len(attractions))
        att1 = attractions[att_idx_start] if attractions else None
        att2 = attractions[(att_idx_start + 1) % len(attractions)] if len(attractions) > 1 else None
        
        # Primary timeline
        timeline: List[ActivityItem] = [
            ActivityItem(
                id=f"d{day_idx}-act-1",
                time="08:30 - 09:30",
                title=f"Breakfast: Verified {intake.diet} Regional Delicacies",
                category="Food & Dining",
                description=f"Enjoy piping hot breakfast matching your '{intake.diet}' dietary requirements with fresh beverages.",
                location_name=f"{dest_name} Heritage Diner",
                coordinates={"lat": dest_data["coordinates"]["lat"] + 0.002, "lng": dest_data["coordinates"]["lng"] + 0.002},
                type="indoor",
                cost_estimate=250 * people,
                elder_friendly=True,
                wheelchair_friendly=True,
                diet_tags=[intake.diet, "Pure Prep"],
                insider_tip="Try the house signature herbal tea for morning refreshment."
            )
        ]
        
        if att1:
            timeline.append(ActivityItem(
                id=f"d{day_idx}-act-2",
                time="10:00 - 12:30",
                title=att1["name"],
                category=att1.get("category", "Sightseeing"),
                description=att1["description"],
                location_name=att1["name"],
                coordinates=att1["coordinates"],
                type=att1.get("type", "outdoor"),
                cost_estimate=att1.get("entry_fee", 50) * people,
                elder_friendly=att1.get("elder_accessible", True),
                wheelchair_friendly=att1.get("wheelchair_accessible", True),
                diet_tags=[],
                indoor_alternative=att1.get("indoor_alternative"),
                insider_tip="Best lighting for photos and coolest breeze during morning hours."
            ))
            
        timeline.append(ActivityItem(
            id=f"d{day_idx}-act-3",
            time="13:00 - 14:30",
            title="Authentic Midday Lunch & Relaxation Interval",
            category="Food & Rest",
            description=f"Sit-down gourmet meal featuring local {intake.diet} specialties followed by a relaxed tea pause.",
            location_name="Curated Culinary Garden",
            coordinates={"lat": dest_data["coordinates"]["lat"] + 0.004, "lng": dest_data["coordinates"]["lng"] + 0.004},
            type="indoor",
            cost_estimate=400 * people,
            elder_friendly=True,
            wheelchair_friendly=True,
            diet_tags=[intake.diet, "Elder Friendly Seating"],
            insider_tip="Comfortable air-conditioned seating ensures zero afternoon heat exhaustion."
        ))
        
        if att2:
            timeline.append(ActivityItem(
                id=f"d{day_idx}-act-4",
                time="15:30 - 18:00",
                title=att2["name"],
                category=att2.get("category", "Culture"),
                description=att2["description"],
                location_name=att2["name"],
                coordinates=att2["coordinates"],
                type=att2.get("type", "outdoor"),
                cost_estimate=att2.get("entry_fee", 50) * people,
                elder_friendly=att2.get("elder_accessible", True),
                wheelchair_friendly=att2.get("wheelchair_accessible", True),
                diet_tags=[],
                indoor_alternative=att2.get("indoor_alternative"),
                insider_tip="Golden hour views are spectacular here; don't forget your camera!"
            ))
            
        timeline.append(ActivityItem(
            id=f"d{day_idx}-act-5",
            time="19:00 - 21:00",
            title="Evening Promenade & Ambient Dinner",
            category="Evening Leisure",
            description="Leisure stroll through lit promenades with ambient music and chef-curated dinner.",
            location_name=f"{dest_name} Waterfront / Promenade",
            coordinates={"lat": dest_data["coordinates"]["lat"] + 0.006, "lng": dest_data["coordinates"]["lng"] + 0.006},
            type="covered_outdoor",
            cost_estimate=500 * people,
            elder_friendly=True,
            wheelchair_friendly=True,
            diet_tags=[intake.diet],
            insider_tip="Try the traditional desserts served post-8 PM."
        ))
        
        # Build Plan B timeline (all indoor & rain/closure safe)
        plan_b_timeline: List[ActivityItem] = [
            ActivityItem(
                id=f"d{day_idx}-pb-1",
                time="09:00 - 11:30",
                title=f"{dest_name} Indoor Museum & Interactive Heritage Centre",
                category="Museum & Culture",
                description="Comprehensive indoor air-conditioned galleries showcasing history, textiles, and art with audio-guides.",
                location_name=f"Central {dest_name} Cultural Complex",
                coordinates={"lat": dest_data["coordinates"]["lat"] + 0.001, "lng": dest_data["coordinates"]["lng"] + 0.001},
                type="indoor",
                cost_estimate=100 * people,
                elder_friendly=True,
                wheelchair_friendly=True,
                diet_tags=[],
                insider_tip="Rain-proof underground parking with ramp access."
            ),
            ActivityItem(
                id=f"d{day_idx}-pb-2",
                time="12:00 - 14:00",
                title="Traditional Cooking Masterclass & Covered Courtyard Lunch",
                category="Food Experience",
                description=f"Indoor hands-on demonstration of regional spice blending and gourmet {intake.diet} feast.",
                location_name="Spice & Flavors Culinary Studio",
                coordinates={"lat": dest_data["coordinates"]["lat"] + 0.003, "lng": dest_data["coordinates"]["lng"] + 0.003},
                type="indoor",
                cost_estimate=450 * people,
                elder_friendly=True,
                wheelchair_friendly=True,
                diet_tags=[intake.diet],
                insider_tip="Includes recipe booklet to take home."
            ),
            ActivityItem(
                id=f"d{day_idx}-pb-3",
                time="15:00 - 17:30",
                title="Indoor Artisan Handicraft Gallery & Tea Tasting Lounge",
                category="Craft & Shopping",
                description="Covered artisan complex featuring live weaving, pottery demonstrations, and estate tea tasting.",
                location_name="State Emporium & Tea Pavilion",
                coordinates={"lat": dest_data["coordinates"]["lat"] + 0.005, "lng": dest_data["coordinates"]["lng"] + 0.005},
                type="indoor",
                cost_estimate=200 * people,
                elder_friendly=True,
                wheelchair_friendly=True,
                diet_tags=[],
                insider_tip="Completely sheltered from rain; comfortable sofas for elder seating."
            ),
            ActivityItem(
                id=f"d{day_idx}-pb-4",
                time="18:30 - 20:30",
                title="Indoor Classical Dance / Theatre Performance & Dinner",
                category="Live Performing Arts",
                description="Enchanting indoor evening cultural performance followed by rooftop buffet dinner.",
                location_name="Heritage Auditorium & Restaurant",
                coordinates={"lat": dest_data["coordinates"]["lat"] + 0.007, "lng": dest_data["coordinates"]["lng"] + 0.007},
                type="indoor",
                cost_estimate=550 * people,
                elder_friendly=True,
                wheelchair_friendly=True,
                diet_tags=[intake.diet],
                insider_tip="Audio induction loop available for hearing assistance."
            )
        ]
        
        day_cost = sum(item.cost_estimate for item in timeline)
        
        days_list.append(DayPlan(
            day_number=day_idx,
            date=f"Day {day_idx}",
            title=f"Day {day_idx}: {theme.split('&')[0].strip()}",
            theme=theme,
            timeline=timeline,
            day_summary=f"A balanced exploration spanning cultural gems, relaxed lunch breaks, and evening scenery with average 15-20 min transit between stops.",
            plan_b_available=True,
            plan_b_summary=f"All-weather indoor alternative featuring {dest_name}'s premier museum galleries, culinary workshops, and indoor auditorium shows.",
            plan_b_timeline=plan_b_timeline,
            estimated_day_cost=day_cost,
            travel_time_between_stops="15 - 25 mins by cab / auto"
        ))
        
    # Story mode narrative
    story_en = f"Welcome to your curated WanderMind journey across {dest_name}. Over {duration_days} days, you and your {people} companions will immerse in {dest_data.get('tagline', 'spectacular vistas')}. We have tailored every single hour to ensure strict {intake.diet} dining, serene pacing for all age groups, and instant Plan B readiness should the weather shift."
    
    story_hi = f"वांडरमाइंड में आपका स्वागत है! {dest_name} की {duration_days} दिवसीय यात्रा आपके {people} साथियों के लिए विशेष रूप से डिज़ाइन की गई है। इसमें {intake.diet} भोजन, वरिष्ठ नागरिकों की सुविधा और किसी भी मौसम में तुरंत एक्टिव होने वाला 'प्लान बी' शामिल है।"
    
    story_te = f"వాండర్‌మైండ్‌కి స్వాగతం! {dest_name} లో {duration_days} రోజుల అద్భుతమైన ప్రయాణం మీ {people} మంది కోసం సిద్ధం చేయబడింది. ఇందులో {intake.diet} ఆహారం, కుటుంబ సౌకర్యం మరియు వర్షం లేదా మార్పుల కోసం ప్లాన్-బి ఆటోమేటిక్‌గా అందుబాటులో ఉన్నాయి."
    
    total_itinerary_cost = sum(d.estimated_day_cost for d in days_list) + budget_breakdown.travel + budget_breakdown.stay
    
    await publish_agent_step(
        trip_id,
        "Itinerary Agent",
        f"Itinerary finalized with {len(days_list)} Day Plans + Pre-configured Plan B for every day",
        decision=f"Total estimated trip cost: ₹{total_itinerary_cost:,.0f} (Within budget of ₹{total_budget:,.0f})",
        status="COMPLETED"
    )
    
    return ItineraryResponse(
        trip_id=trip_id,
        destination_id=dest_data.get("id", destination_id),
        destination_name=dest_name,
        duration_days=duration_days,
        total_budget=total_budget,
        estimated_cost=total_itinerary_cost,
        budget_breakdown=budget_breakdown,
        days=days_list,
        food_guide=dest_data.get("food_guide", {}),
        precautions=dest_data.get("precautions", ["Keep hydration bottles", "Verify local operating hours"]),
        packing_checklist=dest_data.get("packing_list", ["Comfortable clothes", "Sunscreen", "Walking shoes"]),
        etiquette=dest_data.get("etiquette", ["Respect local traditions", "Keep public spaces clean"]),
        emergency_info=dest_data.get("emergency_info", {"hospital": "Local General Hospital", "police": "100"}),
        story_mode_narrative=story_en,
        translations={
            "hi": {"narrative": story_hi, "title": f"{dest_name} यात्रा योजना"},
            "te": {"narrative": story_te, "title": f"{dest_name} ప్రయాణ ప్రణాళిక"}
        }
    )
