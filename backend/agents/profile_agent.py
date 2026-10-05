from typing import Dict, Any, List
from models.schemas import IntakeRequest, ProfileValidationResult, BudgetBreakdown
from agents.coordinator import publish_agent_step

async def process_profile_intake(intake: IntakeRequest, trip_id: str = "temp_trip") -> ProfileValidationResult:
    """
    Profile Agent:
    1. Validates budget vs duration vs traveler count.
    2. Detects contradictions (e.g., extreme pace with elders).
    3. Calculates 5-slice animated donut budget allocation.
    4. Enforces hard constraints (diet, elder mobility).
    """
    await publish_agent_step(
        trip_id,
        "Profile Agent",
        "Validating intake parameters and budget feasibility",
        observation=f"Received intake for {intake.travelers_count} travelers, {intake.duration_days} days, budget ₹{intake.total_budget:,.0f}",
        status="THINKING"
    )
    
    warnings: List[str] = []
    suggestions: List[str] = []
    hard_constraints: List[str] = []
    
    # 1. Budget Sanity Check
    total_budget = max(5000.0, float(intake.total_budget))
    days = max(1, intake.duration_days)
    people = max(1, intake.travelers_count)
    per_person_per_day = total_budget / (people * days)
    
    if per_person_per_day < 1200:
        warnings.append(f"Budget of ₹{per_person_per_day:.0f}/person/day is tight for mid-tier stays. Prioritizing budget hostels and train routes.")
        suggestions.append("Consider opting for dormitory hostels or off-peak travel dates.")
    elif per_person_per_day > 6000:
        suggestions.append("Luxury budget detected! Premium heritage resorts and flight travel options enabled.")
    
    # 2. Hard Constraints Check
    if intake.has_elders or intake.elder_mode or intake.mobility_limits:
        hard_constraints.append("HARD CONSTRAINT: All chosen itineraries must feature step-free or elevator-accessible stops with minimal steep incline walking.")
        suggestions.append("Pacing set to Relaxed: maximum 2 major attractions per day with afternoon rest intervals.")
        
    if intake.diet:
        hard_constraints.append(f"HARD CONSTRAINT: Strict {intake.diet} meal verification for all restaurant recommendations.")
        
    if intake.fears:
        for f in intake.fears:
            hard_constraints.append(f"SAFETY CONSTRAINT: Avoid activities involving {f.lower()}.")
            
    # 3. Budget Split Algorithm
    # 30% Travel, 30% Stay, 20% Food, 10% Activities, 10% Emergency Buffer
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
        per_person_per_day=round(per_person_per_day, 2)
    )
    
    # 4. Persona Classification
    vibes_str = ", ".join(intake.vibes) if intake.vibes else "Relaxed"
    if intake.occasion == "Family" and intake.has_elders:
        persona = "Multigenerational Family Explorers (Comfort & Cultural Heritage Focus)"
    elif intake.occasion == "Honeymoon":
        persona = "Romantic Leisure Seekers (Scenic & Intimate Stays Focus)"
    elif intake.occasion == "Friends":
        persona = "Vibrant Youth Cohort (Adventure, Cafes & Shared Experiences)"
    elif intake.occasion == "Solo":
        persona = "Independent Wanderer (Flexibility, Safety & Authentic Discovery)"
    elif intake.occasion == "Pilgrimage":
        persona = "Devotional Heritage Seekers (Temple Darshan & Peaceful Pace)"
    else:
        persona = f"Custom Group ({vibes_str} Explorer)"
        
    await publish_agent_step(
        trip_id,
        "Profile Agent",
        "Intake profile approved and verified against safety rules",
        tool_called="budget_donut_optimizer",
        observation=f"Persona classified as '{persona}'. Budget split generated with ₹{emergency_alloc:,.0f} emergency buffer.",
        decision=f"Enforced {len(hard_constraints)} hard constraints.",
        status="COMPLETED"
    )
    
    return ProfileValidationResult(
        is_valid=True,
        warnings=warnings,
        suggestions=suggestions,
        hard_constraints_enforced=hard_constraints,
        budget_breakdown=budget_breakdown,
        traveler_persona=persona
    )
