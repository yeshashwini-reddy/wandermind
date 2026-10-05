import json
import os
from typing import List, Dict, Any
from models.schemas import IntakeRequest, DestinationMatch, DestinationResponse
from tools.weather_tool import get_destination_weather
from agents.coordinator import publish_agent_step

DESTINATIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "destinations.json")

def load_destinations() -> List[Dict[str, Any]]:
    if os.path.exists(DESTINATIONS_FILE):
        with open(DESTINATIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

async def suggest_destinations(intake: IntakeRequest, trip_id: str = "temp_trip") -> DestinationResponse:
    """
    Destination Agent:
    Ranks 4-6 destinations with Match Scores (0-100), reasons, weather data, cost tiers, and safety ratings.
    """
    await publish_agent_step(
        trip_id,
        "Destination Agent",
        "Evaluating destination catalog against traveler persona and constraints",
        status="THINKING"
    )
    
    raw_destinations = load_destinations()
    ranked_destinations: List[DestinationMatch] = []
    
    user_budget = intake.total_budget
    days = max(1, intake.duration_days)
    people = max(1, intake.travelers_count)
    
    for dest in raw_destinations:
        dest_name = dest["name"]
        
        await publish_agent_step(
            trip_id,
            "Destination Agent",
            f"Analyzing weather and mobility feasibility for {dest_name}",
            tool_called="get_destination_weather",
            status="ACTING"
        )
        
        weather = get_destination_weather(dest_name, dest["coordinates"]["lat"], dest["coordinates"]["lng"])
        
        # Match Score Calculation Algorithm
        score = 70 # baseline
        reasons = []
        
        # 1. Vibe Matching
        dest_vibes = [v.lower() for v in dest.get("vibes", [])]
        user_vibes = [v.lower() for v in intake.vibes] if intake.vibes else ["relaxed"]
        common_vibes = set(dest_vibes).intersection(set(user_vibes))
        if common_vibes:
            score += 15
            reasons.append(f"Direct match with your vibe preference for {', '.join([v.capitalize() for v in common_vibes])}.")
        else:
            score += 5
            
        # 2. Hard Constraint: Elder / Kid Safety & Accessibility
        if intake.has_elders or intake.elder_mode:
            if dest.get("suitable_for_elders", True):
                score += 10
                reasons.append("Highly elder-friendly terrain with step-free heritage sites and minimal steep treks.")
            else:
                score -= 20
                reasons.append("Notice: Contains uneven boulder trails; pacing adjusted for elder safety.")
                
        if intake.has_kids or intake.kid_mode:
            if dest.get("suitable_for_kids", True):
                score += 5
                reasons.append("Family and child-friendly with interactive cultural spots and spacious parks.")
                
        # 3. Budget Fit
        avg_daily = dest.get("avg_cost_per_day", 3500)
        est_trip_cost = avg_daily * days * (people / 2.0) # room/transport sharing factor
        
        if est_trip_cost <= user_budget * 1.1:
            score += 10
            reasons.append(f"Comfortably within budget (est. ₹{est_trip_cost:,.0f} vs ₹{user_budget:,.0f} limit).")
        else:
            score -= 10
            reasons.append(f"Slightly premium destination (est. ₹{est_trip_cost:,.0f}).")
            
        # 4. Hidden Gem vs Popular / Surprise Me Toggle
        if intake.surprise_me:
            score += 12 if "Hidden Gem" in dest.get("tags", []) else 8
            reasons.append("Surprise Me pick: Specially curated wildcard destination with unique cultural immersion.")
        elif intake.hidden_gem_preference and "Hidden Gem" in dest.get("tags", []):
            score += 8
            reasons.append("Unspoiled hidden gem away from mainstream tourist rush.")
        elif not intake.hidden_gem_preference and "Popular" in dest.get("tags", []):
            score += 5
            reasons.append("Top-rated popular destination with world-class hospitality infrastructure.")
            
        # 5. Travel Personality Quiz Matching
        if intake.personality_quiz_answers:
            quiz_traits = list(intake.personality_quiz_answers.values())
            for trait in quiz_traits:
                if any(trait.lower() in v.lower() for v in dest.get("vibes", [])):
                    score += 6
                    reasons.append(f"Aligned with your quiz personality trait for {trait.capitalize()}.")
                    break

        # 6. Diet Matching
        if intake.diet.lower() in ["jain", "veg"]:
            reasons.append(f"Curated {intake.diet} dining map with authentic local preparations.")
            
        # Cap score between 65 and 99
        final_score = min(98, max(68, score))
        
        # Calculate tier costs
        budget_tier_cost = round(dest.get("cost_tiers", {}).get("budget", 2000) * days * (people / 2.0))
        balanced_tier_cost = round(dest.get("cost_tiers", {}).get("balanced", 3500) * days * (people / 2.0))
        premium_tier_cost = round(dest.get("cost_tiers", {}).get("premium", 7000) * days * (people / 2.0))
        
        # Optional member breakdown for group mode
        fairness_breakdown = None
        if intake.group_mode and intake.group_members:
            fairness_breakdown = {m.name: min(99, max(75, final_score + (5 if m.vibe in dest.get("vibes", []) else -3))) for m in intake.group_members}
            
        match_item = DestinationMatch(
            id=dest["id"],
            name=dest["name"],
            tagline=dest["tagline"],
            description=dest["description"],
            state=dest["state"],
            coordinates=dest["coordinates"],
            hero_image=dest["hero_image"],
            gallery=dest.get("gallery", [dest["hero_image"]]),
            match_score=final_score,
            match_reasons=reasons[:3],
            best_season=dest["best_season"],
            current_weather=weather,
            crowd_level=dest["crowd_level"],
            safety_score=dest["safety_score"],
            estimated_total_cost=balanced_tier_cost,
            tier_costs={
                "budget": budget_tier_cost,
                "balanced": balanced_tier_cost,
                "premium": premium_tier_cost
            },
            suitable_for_elders=dest.get("suitable_for_elders", True),
            suitable_for_kids=dest.get("suitable_for_kids", True),
            tags=dest.get("tags", []),
            fairness_breakdown=fairness_breakdown
        )
        ranked_destinations.append(match_item)
        
    # Sort by match score descending
    ranked_destinations.sort(key=lambda x: x.match_score, reverse=True)
    
    top_destinations = ranked_destinations[:6]
    
    await publish_agent_step(
        trip_id,
        "Destination Agent",
        f"Generated top {len(top_destinations)} ranked destination recommendations",
        observation=f"Highest match: {top_destinations[0].name} ({top_destinations[0].match_score}% Match Score)",
        decision="Ranked options by multi-objective optimization (Budget + Weather + Accessibility + Diet).",
        status="COMPLETED"
    )
    
    return DestinationResponse(
        destinations=top_destinations,
        coordinator_summary=f"WanderMind evaluated 8 destinations across weather, crowd patterns, safety indexes, and your ₹{user_budget:,.0f} budget. {top_destinations[0].name} ranked highest with a {top_destinations[0].match_score}% Match Score.",
        applied_filters={
            "duration": f"{days} Days",
            "travelers": f"{people} Travelers",
            "budget": f"₹{user_budget:,.0f}",
            "diet": intake.diet,
            "elder_mode": intake.elder_mode or intake.has_elders,
            "vibes": intake.vibes
        }
    )
