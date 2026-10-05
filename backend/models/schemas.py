from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any, Union

class GroupMemberPreference(BaseModel):
    name: str
    vibe: str = "Relaxed"
    diet: str = "Veg"
    budget_limit: Optional[float] = None
    pace: str = "Moderate" # Slow, Moderate, Fast
    fears_or_dislikes: List[str] = []

class IntakeRequest(BaseModel):
    occasion: str = "Family" # Honeymoon, Family, Friends, Solo, Pilgrimage, School trip
    travelers_count: int = 4
    ages: List[int] = [35, 32, 65, 8]
    has_elders: bool = True
    has_kids: bool = True
    mobility_limits: bool = False
    elder_mode: bool = True
    kid_mode: bool = True
    
    start_city: str = "New Delhi"
    start_date: str = "2026-11-10"
    duration_days: int = 3
    total_budget: float = 30000.0
    
    vibes: List[str] = ["Cultural", "Relaxed"] # Adventure, Relaxed, Cultural, Nightlife, Nature, Foodie
    diet: str = "Veg" # Veg, Non-veg, Jain, Halal
    fears: List[str] = ["Steep heights"]
    hidden_gem_preference: bool = False # Hidden Gem vs Popular
    theme_trip: Optional[str] = None # Heritage, Wellness, Culinary, Photography
    eco_mode: bool = False
    
    surprise_me: bool = False
    group_mode: bool = False
    group_members: Optional[List[GroupMemberPreference]] = []
    personality_quiz_answers: Optional[Dict[str, str]] = None

    @model_validator(mode='after')
    def enforce_occasion_traveler_count(self):
        if self.occasion in ["Solo", "Solo Explorer"]:
            self.travelers_count = 1
        elif self.occasion in ["Honeymoon", "Romantic Honeymoon"]:
            self.travelers_count = 2
        return self

class BudgetBreakdown(BaseModel):
    travel: float
    stay: float
    food: float
    activities: float
    emergency_buffer: float
    total: float
    per_person_per_day: float

class ProfileValidationResult(BaseModel):
    is_valid: bool
    warnings: List[str] = []
    suggestions: List[str] = []
    hard_constraints_enforced: List[str] = []
    budget_breakdown: BudgetBreakdown
    traveler_persona: str

class GroupConsensusResult(BaseModel):
    group_fairness_score: int # 0 - 100
    member_scores: Dict[str, int] # Name -> Score
    compromises_made: List[str]
    trade_off_explanations: List[str]
    unified_vibe: str
    unified_diet: str

class DestinationMatch(BaseModel):
    id: str
    name: str
    tagline: str
    description: str
    state: str
    coordinates: Dict[str, float]
    hero_image: str
    gallery: List[str]
    match_score: int # 0 - 100
    match_reasons: List[str]
    best_season: str
    current_weather: Dict[str, Any]
    crowd_level: str
    safety_score: int
    estimated_total_cost: float
    tier_costs: Dict[str, float]
    suitable_for_elders: bool
    suitable_for_kids: bool
    tags: List[str]
    fairness_breakdown: Optional[Dict[str, int]] = None

class DestinationResponse(BaseModel):
    destinations: List[DestinationMatch]
    coordinator_summary: str
    applied_filters: Dict[str, Any]

class ActivityItem(BaseModel):
    id: str
    time: str # "09:00 - 11:00"
    title: str
    category: str
    description: str
    location_name: str
    coordinates: Dict[str, float]
    type: str # "outdoor", "indoor", "covered_outdoor"
    cost_estimate: float
    elder_friendly: bool
    wheelchair_friendly: bool
    diet_tags: List[str] = []
    indoor_alternative: Optional[str] = None
    insider_tip: str
    photo_url: Optional[str] = None

class DayPlan(BaseModel):
    day_number: int
    date: str
    title: str
    theme: str
    timeline: List[ActivityItem]
    day_summary: str
    plan_b_available: bool = True
    plan_b_summary: str
    plan_b_timeline: Optional[List[ActivityItem]] = None
    estimated_day_cost: float
    travel_time_between_stops: str

class ItineraryResponse(BaseModel):
    trip_id: str
    destination_id: str
    destination_name: str
    duration_days: int
    total_budget: float
    estimated_cost: float
    budget_breakdown: BudgetBreakdown
    days: List[DayPlan]
    food_guide: Dict[str, List[str]]
    precautions: List[str]
    packing_checklist: List[str]
    etiquette: List[str]
    emergency_info: Dict[str, str]
    story_mode_narrative: str
    translations: Dict[str, Dict[str, str]] = {} # "hi", "te" localized narratives

class ReplanRequest(BaseModel):
    trip_id: str
    destination_id: str
    current_day: int = 1
    trigger_type: str # "rain", "place_closed", "train_delayed_2h", "missed_connection", "im_tired", "free_2_hours"
    notes: Optional[str] = None
    current_time: Optional[str] = "13:30"

class ReplanDiffItem(BaseModel):
    slot_time: str
    original_activity: str
    new_activity: str
    change_type: str # "SWAPPED_INDOOR", "RESCHEDULED", "RELAXED_PACE", "SLOT_FILLED", "TIME_ADJUSTED"
    reason: str
    cost_impact: float # +ve or -ve

class ReplanResponse(BaseModel):
    trip_id: str
    trigger_observed: str
    action_summary: str
    agent_reasoning: str
    before_vs_after_diffs: List[ReplanDiffItem]
    updated_day_plan: DayPlan
    cost_delta: float

class WhatNowRequest(BaseModel):
    destination_id: str
    current_lat: float
    current_lng: float
    time_available_hours: float = 2.0
    diet: str = "Veg"
    has_elders: bool = True

class WhatNowOption(BaseModel):
    title: str
    type: str # "cafe", "indoor_spot", "scenic_bench", "museum"
    distance_km: float
    duration_mins: int
    estimated_cost: float
    description: str
    is_elder_friendly: bool

class WhatNowResponse(BaseModel):
    destination_name: str
    current_context: str
    recommendations: List[WhatNowOption]

class BookingOptionItem(BaseModel):
    id: str
    category: str # "transport", "stay"
    type: str # "flight", "train", "bus", "hotel", "resort"
    title: str
    provider: str
    badge: str # "Cheapest", "Fastest", "Best Value", "AI Top Pick"
    duration_or_tier: str
    price: float
    price_per_person: float
    refundable: bool
    cancellation_policy: str
    comfort_score: float
    ai_reasoning: str
    booking_url: Optional[str] = None
    warning_flags: List[str] = []

class BookingSearchResponse(BaseModel):
    trip_id: str
    destination_name: str
    mode: str # "manual" or "ai_best_deal"
    transport_options: List[BookingOptionItem]
    stay_options: List[BookingOptionItem]
    ai_recommended_package: Dict[str, Any]
    total_estimated_package_cost: float
    savings_vs_premium: float

class BookingConfirmRequest(BaseModel):
    trip_id: str
    selected_transport_id: str
    selected_stay_id: str
    passenger_name: str = "Dr. Rajesh Sharma"
    passenger_email: str = "rajesh.sharma@example.com"
    passenger_phone: str = "+91 98765 43210"
    passengers_count: int = 4
    total_amount: float
    simulated_payment_method: str = "UPI / Demo Card"

class BookingReceipt(BaseModel):
    booking_id: str
    trip_id: str
    destination_name: str
    booking_date: str
    passenger_name: str
    passengers_count: int
    transport_details: Dict[str, Any]
    stay_details: Dict[str, Any]
    total_paid: float
    currency: str = "INR (Rs)"
    payment_status: str = "CONFIRMED (SIMULATED)"
    pdf_download_url: str
    qr_code_data: str
    shareable_link: str
    whatsapp_summary: str
    ics_calendar_data: str

class ExpenseCreateRequest(BaseModel):
    trip_id: str
    category: str # "Travel", "Stay", "Food", "Activities", "Emergency"
    description: str
    amount: float
    paid_by: str = "Rajesh"
    split_among: List[str] = ["Rajesh", "Priya", "Parents", "Rohan"]

class ExpenseItemModel(BaseModel):
    id: str
    trip_id: str
    category: str
    description: str
    amount: float
    paid_by: str
    split_among: List[str]
    timestamp: str

class DebtSplit(BaseModel):
    from_member: str
    to_member: str
    amount: float

class LiveTripResponse(BaseModel):
    trip_id: str
    destination_name: str
    total_budget: float
    total_spent: float
    remaining_budget: float
    spend_by_category: Dict[str, float]
    budget_health_status: str # "ON_TRACK", "WARNING_OVERSPENT", "HEALTHY"
    budget_guardian_advice: str
    rebalanced_daily_allowance: float
    overspend_detected: bool
    recent_expenses: List[ExpenseItemModel]
    settlements: List[DebtSplit]
    today_plan: Optional[DayPlan] = None

class AgentActivityEvent(BaseModel):
    id: str
    trip_id: str
    agent_name: str
    step: str
    tool_called: Optional[str] = None
    observation: Optional[str] = None
    decision: Optional[str] = None
    status: str # "THINKING", "ACTING", "OBSERVING", "COMPLETED", "VIOLATION_CHECKED"
    timestamp: str

class EvaluationScenarioResult(BaseModel):
    scenario_id: str
    title: str
    description: str
    persona: str
    constraints_tested: List[str]
    agents_involved: List[str]
    status: str # "PASSED", "FAILED"
    budget_passed: bool
    diet_passed: bool
    mobility_passed: bool
    replan_responsiveness: str
    details: str
    execution_time_ms: int

# ==========================================
# Agentic Travel Search & Recommendation Models
# ==========================================

class ExtractedTripPreferences(BaseModel):
    origin: str = "Hyderabad"
    destination: Optional[str] = "Goa"
    travel_dates: Optional[str] = None
    travelers: int = 1
    budget: float = 30000.0
    priority: str = "balanced" # "fastest", "cheapest", "best_value", "balanced", "time_saving"
    transport_preference: Optional[str] = "any" # "flight", "train", "bus", "any"
    accommodation_preference: Optional[str] = None
    dietary_requirements: Optional[str] = "Veg"
    mobility_requirements: bool = False
    fears_or_constraints: List[str] = []
    elderly_traveler: bool = False
    overnight_travel: bool = True # False = no overnight travel allowed
    confidence_score: float = 0.95

class TransportOption(BaseModel):
    id: str = ""
    transport_mode: str # "flight" | "train" | "bus"
    provider: str
    origin: str
    destination: str
    price: float # Price per person
    total_price: Optional[float] = None
    currency: str = "INR"
    duration: str
    departure: Optional[str] = None
    arrival: Optional[str] = None
    booking_url: Optional[str] = None
    reason: str
    badge: Optional[str] = None # "Fastest", "Cheapest", "Best Value"
    is_overnight: Optional[bool] = False
    refundable: Optional[bool] = True
    comfort_score: Optional[float] = 4.5
    warning_flags: Optional[List[str]] = []

class TransportRecommendationResponse(BaseModel):
    trip_id: str
    origin: str
    destination: str
    travelers: int
    budget: float
    priority: str
    options: List[TransportOption]
    summary_verdict: str
    validation_passed: bool = True
    validation_notes: List[str] = []
    agent_steps_executed: Optional[List[str]] = []

class AgenticTravelSearchRequest(BaseModel):
    query: Optional[str] = None
    origin: Optional[str] = "Hyderabad"
    destination: Optional[str] = "Goa"
    travelers: Optional[int] = 3
    budget: Optional[float] = 25000.0
    priority: Optional[str] = "fastest" # "fastest" | "cheapest" | "best_value" | "balanced"
    transport_preference: Optional[str] = "any"
    has_elders: Optional[bool] = True
    no_overnight: Optional[bool] = True
    mobility_limits: Optional[bool] = False
    diet: Optional[str] = "Veg"
    trip_id: Optional[str] = "demo_trip"

