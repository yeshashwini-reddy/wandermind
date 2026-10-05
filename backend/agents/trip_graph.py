import asyncio
from typing import Dict, Any, List, Optional, TypedDict
from langgraph.graph import StateGraph, END

from models.schemas import (
    ExtractedTripPreferences,
    TransportOption,
    TransportRecommendationResponse,
    AgenticTravelSearchRequest
)
from tools.travel_search_service import TravelSearchService
from agents.gemini_reasoning import extract_preferences_with_gemini, reason_over_candidate_options
from agents.constraint_validator import ConstraintValidator
from agents.coordinator import publish_agent_step

class TripGraphState(TypedDict, total=False):
    trip_id: str
    user_query: Optional[str]
    origin: str
    destination: Optional[str]
    travel_dates: Optional[str]
    travelers: int
    budget: float
    priority: str
    transport_preference: Optional[str]
    accommodation_preference: Optional[str]
    dietary_requirements: Optional[str]
    mobility_requirements: bool
    fears_or_constraints: List[str]
    elderly_traveler: bool
    no_overnight: bool
    selected_destination: Optional[str]
    candidate_destinations: List[Dict[str, Any]]
    candidate_transport_options: List[Dict[str, Any]]
    retrieved_context: Dict[str, Any]
    selected_transport_options: List[Dict[str, Any]]
    validation_results: Dict[str, Any]
    agent_messages: List[Dict[str, Any]]
    retry_count: int
    final_recommendation: Optional[Dict[str, Any]]
    error: Optional[str]

# -------------------------------------------------------------
# LangGraph Node Handlers
# -------------------------------------------------------------

async def extract_preferences_node(state: TripGraphState) -> TripGraphState:
    trip_id = state.get("trip_id", "demo_trip")
    user_query = state.get("user_query", "")

    await publish_agent_step(
        trip_id,
        "Profile Agent",
        "Extracting user requirements, budget limits, and travel constraints",
        status="THINKING"
    )

    extracted: ExtractedTripPreferences = await extract_preferences_with_gemini(
        user_query,
        fallback_defaults={
            "origin": state.get("origin", "Hyderabad"),
            "destination": state.get("destination", "Goa"),
            "travelers": state.get("travelers", 3),
            "budget": state.get("budget", 25000.0),
            "priority": state.get("priority", "fastest"),
            "has_elders": state.get("elderly_traveler", True),
            "no_overnight": state.get("no_overnight", True)
        }
    )

    await publish_agent_step(
        trip_id,
        "Profile Agent",
        "User preferences extracted and stored in LangGraph trip state",
        observation=f"Route: {extracted.origin} -> {extracted.destination or 'Unspecified'}, Travelers: {extracted.travelers}, Budget: ₹{extracted.budget:,.0f}, Priority: {extracted.priority}, No Overnight: {not extracted.overnight_travel}",
        decision="Locked hard constraints into active execution state.",
        status="COMPLETED"
    )

    return {
        "origin": extracted.origin,
        "destination": extracted.destination or state.get("destination"),
        "travelers": extracted.travelers,
        "budget": extracted.budget,
        "priority": extracted.priority,
        "transport_preference": extracted.transport_preference,
        "dietary_requirements": extracted.dietary_requirements,
        "mobility_requirements": extracted.mobility_requirements,
        "fears_or_constraints": extracted.fears_or_constraints,
        "elderly_traveler": extracted.elderly_traveler,
        "no_overnight": not extracted.overnight_travel,
        "agent_messages": (state.get("agent_messages") or []) + [
            {"agent": "Profile Agent", "content": "Preferences extracted"}
        ]
    }

async def destination_selector_node(state: TripGraphState) -> TripGraphState:
    trip_id = state.get("trip_id", "demo_trip")
    destination = state.get("destination")

    if not destination or destination.lower() in ["where should i travel", "suggest", "any", "unspecified"]:
        await publish_agent_step(
            trip_id,
            "Destination Agent",
            "No destination specified. Scanning curated catalog for top matches",
            status="THINKING"
        )
        candidates = TravelSearchService.search_destinations({
            "vibes": state.get("fears_or_constraints", [])
        })
        selected_dest = candidates[0]["name"] if candidates else "Goa"

        await publish_agent_step(
            trip_id,
            "Destination Agent",
            f"Evaluated destination options and selected '{selected_dest}'",
            observation=f"Recommended {selected_dest} based on budget and accessibility.",
            status="COMPLETED"
        )

        return {
            "destination": selected_dest,
            "selected_destination": selected_dest,
            "candidate_destinations": candidates
        }

    return {
        "selected_destination": destination
    }

async def retrieve_travel_data_node(state: TripGraphState) -> TripGraphState:
    trip_id = state.get("trip_id", "demo_trip")
    origin = state.get("origin", "Hyderabad")
    dest = state.get("destination") or state.get("selected_destination", "Goa")
    budget = state.get("budget", 25000.0)
    travelers = state.get("travelers", 3)
    priority = state.get("priority", "fastest")
    transport_pref = state.get("transport_preference", "any")
    no_overnight = state.get("no_overnight", True)
    has_elders = state.get("elderly_traveler", True)
    mobility = state.get("mobility_requirements", False)

    await publish_agent_step(
        trip_id,
        "Transport Agent",
        f"Retrieving candidate transit options for {origin} -> {dest}",
        tool_called="TravelSearchService.search_transport_options",
        status="ACTING"
    )

    candidates = TravelSearchService.search_transport_options(
        origin=origin,
        destination=dest,
        budget=budget,
        travelers=travelers,
        priority=priority,
        transport_preference=transport_pref,
        no_overnight=no_overnight,
        has_elders=has_elders,
        mobility_limits=mobility
    )

    await publish_agent_step(
        trip_id,
        "Transport Agent",
        f"Retrieved {len(candidates)} relevant transport options (Flights, Trains, Buses)",
        observation=f"Filtered specifically for route '{origin} -> {dest}' without dumping extraneous datasets.",
        status="COMPLETED"
    )

    return {
        "candidate_transport_options": candidates,
        "retrieved_context": {
            "origin": origin,
            "destination": dest,
            "count": len(candidates),
            "urls": [c.get("booking_url") for c in candidates if c.get("booking_url")]
        }
    }

async def gemini_reasoning_node(state: TripGraphState) -> TripGraphState:
    trip_id = state.get("trip_id", "demo_trip")
    candidates = state.get("candidate_transport_options", [])

    await publish_agent_step(
        trip_id,
        "Gemini Reasoner",
        "Evaluating retrieved options against user priorities and hard constraints",
        status="THINKING"
    )

    user_reqs = ExtractedTripPreferences(
        origin=state.get("origin", "Hyderabad"),
        destination=state.get("destination", "Goa"),
        travelers=state.get("travelers", 3),
        budget=state.get("budget", 25000.0),
        priority=state.get("priority", "fastest"),
        transport_preference=state.get("transport_preference", "any"),
        elderly_traveler=state.get("elderly_traveler", True),
        mobility_requirements=state.get("mobility_requirements", False),
        overnight_travel=not state.get("no_overnight", True)
    )

    res: TransportRecommendationResponse = await reason_over_candidate_options(
        user_reqs=user_reqs,
        candidates=candidates,
        trip_id=trip_id
    )

    await publish_agent_step(
        trip_id,
        "Gemini Reasoner",
        "Ranked options and synthesized concise user-facing rationale",
        observation=f"Top Recommendation: {res.options[0].provider if res.options else 'None'}",
        decision=res.summary_verdict,
        status="COMPLETED"
    )

    return {
        "selected_transport_options": [o.model_dump() for o in res.options],
        "final_recommendation": res.model_dump()
    }

async def validate_constraints_node(state: TripGraphState) -> TripGraphState:
    trip_id = state.get("trip_id", "demo_trip")
    raw_options = state.get("selected_transport_options", [])
    budget = state.get("budget", 25000.0)
    travelers = state.get("travelers", 3)
    no_overnight = state.get("no_overnight", True)
    has_elders = state.get("elderly_traveler", True)
    mobility = state.get("mobility_requirements", False)
    retrieved_urls = state.get("retrieved_context", {}).get("urls", [])

    await publish_agent_step(
        trip_id,
        "Constraint Validator",
        "Executing deterministic verification on budget, timing, and booking URLs",
        tool_called="ConstraintValidator.validate_transport_options",
        status="ACTING"
    )

    options_obj = [TransportOption(**o) for o in raw_options]

    is_valid, valid_opts, rejected, notes = ConstraintValidator.validate_transport_options(
        options=options_obj,
        budget=budget,
        travelers=travelers,
        no_overnight=no_overnight,
        has_elders=has_elders,
        mobility_limits=mobility,
        retrieved_candidate_urls=retrieved_urls
    )

    await publish_agent_step(
        trip_id,
        "Constraint Validator",
        f"Validation {'Passed' if is_valid else 'Adjusted'}: {len(valid_opts)} valid options approved",
        observation=f"Validated budget limit (₹{budget:,.0f}) and verified provider booking domains.",
        decision="Rejected any option violating strict no-overnight or budget constraints.",
        status="COMPLETED"
    )

    # Update final recommendation
    final_rec = state.get("final_recommendation") or {}
    final_rec["options"] = [o.model_dump() for o in valid_opts]
    final_rec["validation_passed"] = len(valid_opts) > 0
    final_rec["validation_notes"] = notes
    if not valid_opts:
        final_rec["summary_verdict"] = f"No transportation option matching all your requirements was found for {state.get('origin', 'your origin')} -> {state.get('destination', 'destination')}. Try increasing your budget (current ₹{budget:,.0f}) or allowing additional travel modes."

    return {
        "selected_transport_options": [o.model_dump() for o in valid_opts],
        "validation_results": {
            "is_valid": is_valid,
            "valid_count": len(valid_opts),
            "rejected_count": len(rejected),
            "notes": notes
        },
        "final_recommendation": final_rec
    }

# -------------------------------------------------------------
# Graph Construction & Orchestrator Execution
# -------------------------------------------------------------

def build_travel_agent_graph() -> StateGraph:
    """Builds the compiled LangGraph workflow graph."""
    workflow = StateGraph(TripGraphState)

    workflow.add_node("extract_preferences", extract_preferences_node)
    workflow.add_node("select_destination", destination_selector_node)
    workflow.add_node("retrieve_data", retrieve_travel_data_node)
    workflow.add_node("gemini_reasoning", gemini_reasoning_node)
    workflow.add_node("validate_constraints", validate_constraints_node)

    workflow.set_entry_point("extract_preferences")
    workflow.add_edge("extract_preferences", "select_destination")
    workflow.add_edge("select_destination", "retrieve_data")
    workflow.add_edge("retrieve_data", "gemini_reasoning")
    workflow.add_edge("gemini_reasoning", "validate_constraints")
    workflow.add_edge("validate_constraints", END)

    return workflow.compile()

# Global compiled graph instance
travel_graph_app = build_travel_agent_graph()

async def run_agentic_travel_search(req: AgenticTravelSearchRequest) -> TransportRecommendationResponse:
    """
    Main entry point to execute the LangGraph agentic search pipeline.
    """
    initial_state: TripGraphState = {
        "trip_id": req.trip_id or "demo_trip",
        "user_query": req.query,
        "origin": req.origin or "Hyderabad",
        "destination": req.destination,
        "travelers": req.travelers or 3,
        "budget": req.budget or 25000.0,
        "priority": req.priority or "fastest",
        "transport_preference": req.transport_preference or "any",
        "elderly_traveler": req.has_elders if req.has_elders is not None else True,
        "no_overnight": req.no_overnight if req.no_overnight is not None else True,
        "mobility_requirements": req.mobility_limits or False,
        "retry_count": 0,
        "agent_messages": []
    }

    final_state = await travel_graph_app.ainvoke(initial_state)

    rec_data = final_state.get("final_recommendation")
    if not rec_data or not rec_data.get("options"):
        # Graceful empty response with helpful message
        return TransportRecommendationResponse(
            trip_id=final_state.get("trip_id", "demo_trip"),
            origin=final_state.get("origin", "Hyderabad"),
            destination=final_state.get("destination", "Goa"),
            travelers=final_state.get("travelers", 3),
            budget=final_state.get("budget", 25000.0),
            priority=final_state.get("priority", "fastest"),
            options=[],
            summary_verdict="No transportation option matching all your requirements was found. Try increasing your budget or allowing additional travel modes.",
            validation_passed=False,
            validation_notes=final_state.get("validation_results", {}).get("notes", ["Budget or timing constraints too restrictive."])
        )

    options = [TransportOption(**o) for o in rec_data["options"]]
    return TransportRecommendationResponse(
        trip_id=rec_data.get("trip_id", "demo_trip"),
        origin=rec_data.get("origin", "Hyderabad"),
        destination=rec_data.get("destination", "Goa"),
        travelers=rec_data.get("travelers", 3),
        budget=rec_data.get("budget", 25000.0),
        priority=rec_data.get("priority", "fastest"),
        options=options,
        summary_verdict=rec_data.get("summary_verdict", "Travel options prepared successfully."),
        validation_passed=rec_data.get("validation_passed", True),
        validation_notes=rec_data.get("validation_notes", [])
    )
