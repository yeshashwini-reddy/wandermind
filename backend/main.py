import os
import json
import asyncio
from dotenv import load_dotenv

# Load backend environment variables (.env)
load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import Dict, Any, List

from models.schemas import (
    IntakeRequest, ProfileValidationResult,
    GroupMemberPreference, GroupConsensusResult,
    DestinationResponse,
    ItineraryResponse,
    ReplanRequest, ReplanResponse,
    WhatNowRequest, WhatNowResponse,
    BookingSearchResponse, BookingConfirmRequest, BookingReceipt,
    ExpenseCreateRequest, LiveTripResponse,
    EvaluationScenarioResult,
    AgenticTravelSearchRequest, TransportRecommendationResponse, ExtractedTripPreferences
)

from agents.coordinator import get_stream_queue, remove_stream_queue, publish_agent_step
from agents.profile_agent import process_profile_intake
from agents.group_consensus_agent import calculate_group_consensus
from agents.destination_agent import suggest_destinations
from agents.itinerary_agent import generate_itinerary
from agents.replanner_agent import handle_replanning_event, handle_what_now
from agents.booking_agent import execute_booking_search, confirm_simulated_booking
from agents.budget_guardian_agent import record_new_expense, get_live_trip_state
from agents.trip_graph import run_agentic_travel_search
from agents.gemini_reasoning import extract_preferences_with_gemini
from services.unsplash_service import fetch_destination_photos_from_unsplash
from services.locationiq_service import get_maps_route
from evaluation.benchmark_runner import run_all_benchmarks
from tools.pdf_tool import generate_booking_receipt_pdf
from database import get_booking, save_trip, get_trip

app = FastAPI(
    title="WanderMind Multi-Agent API",
    description="Autonomous Multi-Agent Trip Planner & Real-Time Replanning Engine",
    version="1.0.0"
)

# Enable CORS for React Vite frontend (supports direct localhost:5173 and Vite proxy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Real Destination Media API (Unsplash Integration)
@app.get("/api/destination-media")
async def get_destination_media(destination: str, count: int = 10):
    return await fetch_destination_photos_from_unsplash(destination, count=count)

# Dedicated Maps Geocoding & Routing API (LocationIQ Integration)
@app.get("/api/maps/route")
async def get_maps_route_endpoint(origin: str, destination: str):
    return await get_maps_route(origin_query=origin, destination_query=destination)

# 1. Profile Agent Endpoint
@app.post("/api/profile", response_model=ProfileValidationResult)
async def validate_profile_endpoint(request: IntakeRequest):
    trip_id = f"trip_{int(asyncio.get_event_loop().time()*1000)}"
    return await process_profile_intake(request, trip_id=trip_id)

# 2. Group Consensus Agent Endpoint
@app.post("/api/group-consensus", response_model=GroupConsensusResult)
async def group_consensus_endpoint(members: List[GroupMemberPreference]):
    return await calculate_group_consensus(members)

# 3. Destination Agent Endpoint
@app.post("/api/destinations", response_model=DestinationResponse)
async def suggest_destinations_endpoint(request: IntakeRequest, trip_id: str = "demo_trip"):
    return await suggest_destinations(request, trip_id=trip_id)

# 4. Itinerary Agent Endpoint
class ItineraryRequest(BaseModel):
    destination_id: str
    intake: IntakeRequest
    trip_id: str = "demo_trip"

@app.post("/api/itinerary", response_model=ItineraryResponse)
async def generate_itinerary_endpoint(req: ItineraryRequest):
    res = await generate_itinerary(req.destination_id, req.intake, trip_id=req.trip_id)
    # Save to SQLite DB
    save_trip(
        req.trip_id,
        req.intake.dict(),
        req.destination_id,
        res.destination_name,
        req.intake.total_budget,
        res.dict()
    )
    return res

# 5. Replanner Agent Endpoint (KEY FEATURE)
@app.post("/api/replan", response_model=ReplanResponse)
async def replan_endpoint(request: ReplanRequest):
    return await handle_replanning_event(request)

# 6. What Now Endpoint
@app.post("/api/whatnow", response_model=WhatNowResponse)
async def what_now_endpoint(request: WhatNowRequest):
    return await handle_what_now(request)

# 7. Booking Agent Endpoints
class BookingSearchReq(BaseModel):
    trip_id: str
    destination_id: str
    travelers_count: int = 4
    mode: str = "ai_best_deal"

@app.post("/api/booking/search", response_model=BookingSearchResponse)
async def booking_search_endpoint(req: BookingSearchReq):
    return await execute_booking_search(req.trip_id, req.destination_id, req.travelers_count, req.mode)

@app.post("/api/booking/confirm", response_model=BookingReceipt)
async def booking_confirm_endpoint(req: BookingConfirmRequest):
    return await confirm_simulated_booking(req)

# 7b. Agentic Travel Search (LangGraph + Gemini + Constraint Validator)
@app.post("/api/travel/search", response_model=TransportRecommendationResponse)
async def agentic_travel_search_endpoint(req: AgenticTravelSearchRequest):
    return await run_agentic_travel_search(req)

class ExtractPrefReq(BaseModel):
    query: str

@app.post("/api/travel/extract-preferences", response_model=ExtractedTripPreferences)
async def extract_preferences_endpoint(req: ExtractPrefReq):
    return await extract_preferences_with_gemini(req.query)

# 8. Budget Guardian / Expenses Endpoints
@app.post("/api/expenses", response_model=LiveTripResponse)
async def create_expense_endpoint(req: ExpenseCreateRequest):
    return await record_new_expense(req)

@app.get("/api/budget/{trip_id}", response_model=LiveTripResponse)
async def get_budget_endpoint(trip_id: str):
    return await get_live_trip_state(trip_id)

# 9. Receipt & PDF Endpoints
@app.get("/api/receipt/{booking_id}")
async def get_receipt_data(booking_id: str):
    data = get_booking(booking_id)
    if not data:
        # Generate sample verified booking
        data = {
            "booking_id": booking_id,
            "trip_id": booking_id,
            "destination_name": "Goa, India",
            "passenger_name": "Dr. Rajesh Sharma",
            "passenger_email": "rajesh.sharma@example.com",
            "passenger_phone": "+91 98765 43210",
            "passengers_count": 4,
            "transport_details": {
                "title": "Vande Bharat Superfast Express",
                "provider": "IRCTC Indian Railways",
                "badge": "Best Value",
                "price": 7400.0
            },
            "stay_details": {
                "title": "Santana Beachfront Heritage Villa & Spa",
                "duration_or_tier": "2 Nights Deluxe Garden Suite",
                "badge": "Best Value",
                "price": 6800.0
            },
            "total_paid": 14200.0,
            "booking_date": "10 Nov 2026, 14:30"
        }
    return data

@app.get("/api/receipt/{booking_id}/pdf")
async def download_receipt_pdf(booking_id: str):
    data = get_booking(booking_id)
    if not data:
        data = {
            "booking_id": booking_id,
            "trip_id": booking_id,
            "destination_name": "Goa, India",
            "passenger_name": "Dr. Rajesh Sharma",
            "passenger_email": "rajesh.sharma@example.com",
            "passenger_phone": "+91 98765 43210",
            "passengers_count": 4,
            "transport_details": {
                "title": "Vande Bharat Superfast Express",
                "provider": "IRCTC Indian Railways",
                "badge": "Best Value",
                "price": 7400.0
            },
            "stay_details": {
                "title": "Santana Beachfront Heritage Villa & Spa",
                "duration_or_tier": "2 Nights Deluxe Garden Suite",
                "badge": "Best Value",
                "price": 6800.0
            },
            "total_paid": 14200.0,
            "booking_date": "10 Nov 2026, 14:30"
        }
    pdf_path = generate_booking_receipt_pdf(data)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"WanderMind_Receipt_{booking_id}.pdf"
    )

# 10. Agent Activity SSE Stream
@app.get("/api/agent-stream/{trip_id}")
async def agent_stream(trip_id: str, request: Request):
    """
    Server-Sent Events (SSE) streaming endpoint:
    Streams live agent steps (Profile -> Destination -> Itinerary -> Replanner -> Budget) to frontend.
    """
    q = get_stream_queue(trip_id)
    
    async def event_generator():
        # Emit initial connection handshake
        yield f"event: ping\ndata: {json.dumps({'message': 'Connected to WanderMind Agent Mesh', 'trip_id': trip_id})}\n\n"
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event_data = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"event: agent_step\ndata: {json.dumps(event_data)}\n\n"
                except asyncio.TimeoutError:
                    yield f"event: ping\ndata: {json.dumps({'status': 'heartbeat'})}\n\n"
        finally:
            remove_stream_queue(trip_id, q)
            
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# 11. Evaluation Benchmark Endpoint
@app.get("/api/evaluation", response_model=List[EvaluationScenarioResult])
async def evaluation_benchmark_endpoint():
    return await run_all_benchmarks()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
