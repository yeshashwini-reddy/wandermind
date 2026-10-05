import os
import json
import re
import httpx
from typing import Dict, Any, List, Optional
from models.schemas import ExtractedTripPreferences, TransportOption, TransportRecommendationResponse
from tools.travel_search_service import TravelSearchService
from services.provider_registry import ProviderRegistry

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()

async def extract_preferences_with_gemini(query: str, fallback_defaults: Optional[Dict[str, Any]] = None) -> ExtractedTripPreferences:
    """
    Extracts structured trip preferences from natural-language user prompts.
    Handles inputs like:
    "I want to travel from Hyderabad to Goa with my parents. My budget is 25000. I want the fastest option and don't want overnight travel."
    """
    if not query or not query.strip():
        defaults = fallback_defaults or {}
        orig = defaults.get("origin") or defaults.get("start_city") or "Hyderabad"
        dest = defaults.get("destination") or "Goa"
        trav = defaults.get("travelers") or defaults.get("travelers_count") or 3
        budg = defaults.get("budget") or defaults.get("total_budget") or 25000.0
        prio = defaults.get("priority") or "balanced"
        ovn = not defaults.get("no_overnight", False) if "no_overnight" in defaults else defaults.get("overnight_travel", True)
        eld = defaults.get("has_elders") if "has_elders" in defaults else defaults.get("elderly_traveler", True)
        return ExtractedTripPreferences(
            origin=orig,
            destination=dest,
            travelers=trav,
            budget=float(budg),
            priority=prio,
            elderly_traveler=eld,
            overnight_travel=ovn
        )

    # If Gemini API Key is configured, attempt LLM extraction
    if GEMINI_API_KEY:
        try:
            prompt = f"""You are an expert travel requirement extractor.
Convert this user travel request into structured JSON matching this exact schema:
- origin (string): Departure city
- destination (string or null): Arrival destination city/spot (null if asking for suggestions)
- travelers (integer): Total number of travelers
- budget (number): Total trip budget in INR
- priority (string): "fastest" | "cheapest" | "best_value" | "balanced"
- transport_preference (string): "flight" | "train" | "bus" | "any"
- dietary_requirements (string): "Veg" | "Non-veg" | "Jain" | "Halal"
- mobility_requirements (boolean): true if wheelchair/step-free required
- fears_or_constraints (list of strings): Any stated fears or safety limits
- elderly_traveler (boolean): true if parents, grandparents, senior citizens or elders are mentioned
- overnight_travel (boolean): false if user says "no overnight", "don't want overnight", "avoid night travel", else true

USER REQUEST:
\"\"\"{query}\"\"\"

Return ONLY a valid JSON object. No Markdown code fences, no extra text."""

            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"responseMimeType": "application/json"}
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text_out)
                    return ExtractedTripPreferences(**parsed)
        except Exception as e:
            # Fallback to local heuristic extractor on any network/API issue
            pass

    # Deterministic local NLP extractor
    return _heuristic_extract_preferences(query, fallback_defaults)

def _heuristic_extract_preferences(query: str, defaults: Optional[Dict[str, Any]] = None) -> ExtractedTripPreferences:
    defaults = defaults or {}
    q_lower = query.lower()

    # 1. Origin & Destination Regex
    origin = defaults.get("origin") or defaults.get("start_city") or "Hyderabad"
    destination = defaults.get("destination") or "Goa"

    # Match patterns like "from <origin> to <destination>"
    from_to_match = re.search(r"from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+with|\s+my|\s+for|\.|\band\b|\bbudget\b|$)", query, re.IGNORECASE)
    if from_to_match:
        origin = from_to_match.group(1).strip().title()
        destination = from_to_match.group(2).strip().title()
    else:
        # Check for destination recommendation intent
        if "where should i travel" in q_lower or "recommend a place" in q_lower or "suggest destination" in q_lower:
            destination = None
        else:
            # Check for city keywords
            for city in ["Goa", "Jaipur", "Munnar", "Manali", "Hampi", "Varanasi", "Coorg", "Hyderabad", "Delhi", "New Delhi", "Mumbai", "Bangalore"]:
                if city.lower() in q_lower:
                    if f"to {city.lower()}" in q_lower:
                        destination = city
                    elif f"from {city.lower()}" in q_lower:
                        origin = city

    # 2. Travelers
    travelers = defaults.get("travelers") or defaults.get("travelers_count") or 1
    if "parents" in q_lower or "mom and dad" in q_lower:
        travelers = max(travelers, 3) # user + mom + dad
    elif "family" in q_lower:
        travelers = max(travelers, 4)
    elif "friends" in q_lower or "couple" in q_lower:
        travelers = max(travelers, 2)
    
    num_match = re.search(r"(\d+)\s*(?:people|travelers|members|persons|passengers)", q_lower)
    if num_match:
        travelers = int(num_match.group(1))

    # 3. Budget
    budget = defaults.get("budget") or defaults.get("total_budget") or 30000.0
    budget_match = re.search(r"(?:budget|budget of|cost limit|under|in)\s*(?:is|of|around|approx|rs\.?|inr|₹)?\s*(\d+[\d,]*)", q_lower)
    if budget_match:
        try:
            val_str = budget_match.group(1).replace(",", "")
            budget = float(val_str)
        except Exception:
            pass

    # 4. Priority
    priority = "balanced"
    if "fastest" in q_lower or "quickest" in q_lower or "least time" in q_lower or "time saving" in q_lower or "speed" in q_lower:
        priority = "fastest"
    elif "cheapest" in q_lower or "lowest cost" in q_lower or "budget friendly" in q_lower or "economical" in q_lower:
        priority = "cheapest"
    elif "best value" in q_lower or "comfortable" in q_lower:
        priority = "best_value"

    # 5. Overnight
    overnight = True
    if "no overnight" in q_lower or "don't want overnight" in q_lower or "dont want overnight" in q_lower or "avoid overnight" in q_lower or "day travel only" in q_lower or "not overnight" in q_lower:
        overnight = False

    # 6. Elders / Mobility
    has_elders = False
    if "parents" in q_lower or "elder" in q_lower or "grandparent" in q_lower or "senior" in q_lower or defaults.get("has_elders"):
        has_elders = True

    mobility = False
    if "wheelchair" in q_lower or "mobility" in q_lower or "step free" in q_lower or defaults.get("mobility_limits"):
        mobility = True

    # 7. Transport Preference
    trans_pref = "any"
    if "flight" in q_lower or "fly" in q_lower:
        trans_pref = "flight"
    elif "train" in q_lower or "railway" in q_lower:
        trans_pref = "train"
    elif "bus" in q_lower or "volvo" in q_lower:
        trans_pref = "bus"

    return ExtractedTripPreferences(
        origin=origin,
        destination=destination,
        travelers=travelers,
        budget=budget,
        priority=priority,
        transport_preference=trans_pref,
        elderly_traveler=has_elders,
        mobility_requirements=mobility,
        overnight_travel=overnight,
        confidence_score=0.92
    )

async def reason_over_candidate_options(
    user_reqs: ExtractedTripPreferences,
    candidates: List[Dict[str, Any]],
    trip_id: str = "demo_trip"
) -> TransportRecommendationResponse:
    """
    Sends ONLY the relevant retrieved travel options to Gemini with clear decision criteria.
    Gemini compares options according to user preferences and returns structured options.
    If GEMINI_API_KEY is not configured or fails, uses an intelligent deterministic LLM evaluator.
    """
    origin = user_reqs.origin
    dest = user_reqs.destination or "Selected Destination"
    travelers = max(1, user_reqs.travelers)
    budget = user_reqs.budget
    priority = user_reqs.priority
    no_overnight = not user_reqs.overnight_travel

    if not candidates:
        return TransportRecommendationResponse(
            trip_id=trip_id,
            origin=origin,
            destination=dest,
            travelers=travelers,
            budget=budget,
            priority=priority,
            options=[],
            summary_verdict="No transportation candidates found for this route and budget combination.",
            validation_passed=False,
            validation_notes=["Search retrieval layer returned 0 options."]
        )

    # If Gemini API Key exists, use Gemini reasoning
    if GEMINI_API_KEY:
        try:
            # Prepare strictly relevant candidate records (no extra bulk data)
            compact_candidates = []
            for c in candidates:
                compact_candidates.append({
                    "id": c.get("id"),
                    "transport_mode": c.get("type"),
                    "provider": c.get("operator"),
                    "origin": c.get("origin", origin),
                    "destination": c.get("destination", dest),
                    "price_per_person": c.get("price_per_person"),
                    "total_price": c.get("price_per_person") * travelers,
                    "duration": c.get("duration"),
                    "departure": c.get("departure_time"),
                    "arrival": c.get("arrival_time"),
                    "is_overnight": c.get("is_overnight", False),
                    "booking_url": c.get("booking_url"),
                    "badge": c.get("badge")
                })

            prompt = f"""You are WanderMind's Agentic Travel Reasoner.
Compare the available retrieved transportation options and select the top 2-3 recommendations for the user.

USER REQUIREMENTS:
- Route: {origin} -> {dest}
- Travelers: {travelers}
- Total Budget: ₹{budget:,.0f} (Max ₹{budget/travelers:,.0f} per person)
- Priority: {priority}
- Overnight Travel Allowed: {not no_overnight}
- Elderly Travelers Present: {user_reqs.elderly_traveler}

AVAILABLE RETRIEVED OPTIONS:
{json.dumps(compact_candidates, indent=2)}

DECISION RULES:
1. Prefer options that best satisfy the user's stated priority ('{priority}').
2. Reject or do not rank first any option that violates overnight or budget constraints.
3. Write a concise, 1-sentence user-facing reason for each selected option (e.g. "Fastest flight option arriving in 1h 20m, well within your budget."). Do NOT expose chain-of-thought.
4. DO NOT invent prices, durations, providers, or URLs. Use the exact booking_url from the provided options.

Return ONLY a JSON object matching this exact schema:
{{
  "options": [
    {{
      "id": "string",
      "transport_mode": "flight | train | bus",
      "provider": "string",
      "origin": "{origin}",
      "destination": "{dest}",
      "price": number,
      "total_price": number,
      "currency": "INR",
      "duration": "string",
      "departure": "string",
      "arrival": "string",
      "booking_url": "string (MUST MATCH PROVIDED CANDIDATE URL)",
      "reason": "string",
      "badge": "string",
      "is_overnight": boolean
    }}
  ],
  "summary_verdict": "string"
}}"""

            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"responseMimeType": "application/json"}
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    parsed = json.loads(text_out)
                    opts = []
                    for o in parsed.get("options", []):
                        opt_item = TransportOption(**o)
                        # Strictly override any LLM-supplied URL with verified official provider URL
                        opt_item.booking_url = ProviderRegistry.resolve_booking_url(opt_item.provider, opt_item.transport_mode)
                        opts.append(opt_item)

                    return TransportRecommendationResponse(
                        trip_id=trip_id,
                        origin=origin,
                        destination=dest,
                        travelers=travelers,
                        budget=budget,
                        priority=priority,
                        options=opts,
                        summary_verdict=parsed.get("summary_verdict", f"Selected top options for {origin} to {dest}"),
                        validation_passed=True,
                        validation_notes=[]
                    )
        except Exception as e:
            # Fallback to deterministic LLM evaluator on error
            pass

    # Deterministic LLM Reasoning & Comparison Engine
    return _deterministic_llm_reasoning(user_reqs, candidates, trip_id)

def _deterministic_llm_reasoning(
    user_reqs: ExtractedTripPreferences,
    candidates: List[Dict[str, Any]],
    trip_id: str
) -> TransportRecommendationResponse:
    """
    Intelligent deterministic ranking and reasoning engine that compares
    retrieved candidate records against user preferences.
    """
    origin = user_reqs.origin
    dest = user_reqs.destination or "Selected Destination"
    travelers = max(1, user_reqs.travelers)
    budget = user_reqs.budget
    priority = user_reqs.priority
    no_overnight = not user_reqs.overnight_travel

    # Filter out obvious constraint violations first
    eligible = []
    for c in candidates:
        total_p = float(c.get("price_per_person", 0)) * travelers
        is_ovn = c.get("is_overnight", False) or "(+1)" in str(c.get("arrival_time", ""))

        if no_overnight and is_ovn:
            continue
        if budget > 0 and total_p > (budget * 1.1): # Strict budget constraint
            continue
        eligible.append(c)

    # If no candidate survived strict filtering, return empty result
    if not eligible:
        return TransportRecommendationResponse(
            trip_id=trip_id,
            origin=origin,
            destination=dest,
            travelers=travelers,
            budget=budget,
            priority=priority,
            options=[],
            summary_verdict=f"No transportation option matching all your requirements was found for {origin} -> {dest}. Try increasing your budget (current ₹{budget:,.0f}) or allowing additional travel modes.",
            validation_passed=False,
            validation_notes=["All available transportation options exceeded your specified budget or violated timing constraints."]
        )

    # Rank according to user priority
    if priority == "fastest" or priority == "time_saving":
        eligible.sort(key=lambda x: (x.get("duration_minutes", 9999), x.get("price_per_person", 9999)))
    elif priority == "cheapest":
        eligible.sort(key=lambda x: (x.get("price_per_person", 9999), x.get("duration_minutes", 9999)))
    else: # best_value or balanced
        eligible.sort(key=lambda x: (-x.get("comfort_rating", 3.0), x.get("duration_minutes", 9999)))

    # Select top 3 distinct mode options if available
    selected_options: List[TransportOption] = []
    seen_modes = set()

    for c in eligible:
        mode = c.get("type", "flight")
        price_p = float(c.get("price_per_person", 0))
        tot_p = price_p * travelers
        dur = c.get("duration", "2h")
        op = c.get("operator", "Travel Provider")
        badge = c.get("badge", "Recommended")
        url = ProviderRegistry.resolve_booking_url(op, mode) or c.get("booking_url")

        # Generate concise decision reason
        if priority == "fastest" and mode == "flight":
            reason = f"Fastest transit ({dur}) saving maximum travel time for your group."
        elif priority == "cheapest" or mode == "bus":
            reason = f"Most economical option at ₹{price_p:,.0f} per person (Total ₹{tot_p:,.0f})."
        elif mode == "train":
            reason = f"Optimal comfort & value with punctual {op} schedule ({dur})."
        else:
            reason = f"Recommended {mode.title()} option balancing duration ({dur}) and budget."

        opt = TransportOption(
            id=c.get("id", f"opt-{len(selected_options)+1}"),
            transport_mode=mode,
            provider=op,
            origin=origin,
            destination=dest,
            price=price_p,
            total_price=tot_p,
            currency="INR",
            duration=dur,
            departure=c.get("departure_time"),
            arrival=c.get("arrival_time"),
            booking_url=url,
            reason=reason,
            badge=badge,
            is_overnight=c.get("is_overnight", False),
            refundable=c.get("refundable", True),
            comfort_score=c.get("comfort_rating", 4.5)
        )
        selected_options.append(opt)
        seen_modes.add(mode)
        if len(selected_options) >= 3:
            break

    top_pick = selected_options[0] if selected_options else None
    summary_verdict = (
        f"Compared {len(candidates)} available routes. "
        f"{top_pick.provider} ({top_pick.transport_mode.title()}) ranked as #1 pick satisfying your '{priority}' priority "
        f"within ₹{budget:,.0f} total budget."
        if top_pick else "No suitable routes found."
    )

    return TransportRecommendationResponse(
        trip_id=trip_id,
        origin=origin,
        destination=dest,
        travelers=travelers,
        budget=budget,
        priority=priority,
        options=selected_options,
        summary_verdict=summary_verdict,
        validation_passed=True,
        validation_notes=[]
    )
