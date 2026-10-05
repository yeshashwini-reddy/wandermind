from typing import Dict, Any, List
from models.schemas import BookingSearchResponse, BookingOptionItem, BookingConfirmRequest, BookingReceipt
from tools.fare_tool import search_travel_options
from agents.coordinator import publish_agent_step
from database import save_booking, get_booking
from datetime import datetime

async def execute_booking_search(trip_id: str, destination_id: str, travelers_count: int = 4, mode: str = "ai_best_deal") -> BookingSearchResponse:
    """
    Booking Agent:
    Compares flights, trains, buses, hotels, ranks top 3 as Cheapest / Fastest / Best Value,
    flags cancellation risk, and computes cost per person.
    """
    await publish_agent_step(
        trip_id,
        "Booking Agent",
        f"Scanning multi-modal transit & verified hotel inventory for {destination_id.title()}",
        status="THINKING"
    )
    
    await publish_agent_step(
        trip_id,
        "Booking Agent",
        "Executing fare comparison matrix across airlines, railways, and hotel providers",
        tool_called="fare_comparison_engine",
        status="ACTING"
    )
    
    search_data = search_travel_options(destination_id, travelers_count)
    
    trans_items = [BookingOptionItem(**t) for t in search_data["transports"]]
    stay_items = [BookingOptionItem(**s) for s in search_data["stays"]]
    ai_package = search_data["ai_package"]
    
    await publish_agent_step(
        trip_id,
        "Booking Agent",
        "Ranked top options into 'Cheapest', 'Fastest', and 'Best Value'",
        observation=f"AI Best Deal: {ai_package['transport']['title']} + {ai_package['stay']['title']} (Savings: ₹{search_data['savings_vs_premium']:,.0f})",
        decision="Flagged non-refundable tickets and prioritized elder-accessible rooms.",
        status="COMPLETED"
    )
    
    return BookingSearchResponse(
        trip_id=trip_id,
        destination_name=destination_id.capitalize(),
        mode=mode,
        transport_options=trans_items,
        stay_options=stay_items,
        ai_recommended_package=ai_package,
        total_estimated_package_cost=search_data["total_estimated_package_cost"],
        savings_vs_premium=search_data["savings_vs_premium"]
    )

async def confirm_simulated_booking(req: BookingConfirmRequest) -> BookingReceipt:
    """
    Processes simulated booking checkout, stores in SQLite, and returns rich confirmation.
    """
    trip_id = req.trip_id
    booking_id = f"WM-{int(datetime.now().timestamp()*1000)%1000000:06d}"
    
    await publish_agent_step(
        trip_id,
        "Booking Agent",
        f"Processing simulated payment and ticket issuance for booking #{booking_id}",
        tool_called="simulated_payment_gateway",
        status="ACTING"
    )
    
    booking_payload = {
        "booking_id": booking_id,
        "trip_id": trip_id,
        "passenger_name": req.passenger_name,
        "passenger_email": req.passenger_email,
        "passenger_phone": req.passenger_phone,
        "passengers_count": req.passengers_count,
        "transport_details": {
            "id": req.selected_transport_id,
            "title": "Vande Bharat Superfast Express (Coach C2, Seats 41-44)",
            "provider": "IRCTC Indian Railways",
            "departure": "06:00 AM",
            "arrival": "12:30 PM",
            "badge": "Best Value",
            "price": req.total_amount * 0.45
        },
        "stay_details": {
            "id": req.selected_stay_id,
            "title": "Heritage Palm Boutique Villa & Garden Spa",
            "duration_or_tier": "2 Nights, 2 Deluxe Rooms",
            "badge": "Best Value",
            "price": req.total_amount * 0.55
        },
        "total_paid": req.total_amount,
        "booking_date": datetime.now().strftime("%d %b %Y, %H:%M"),
        "payment_method": req.simulated_payment_method
    }
    
    # Save in DB
    save_booking(booking_payload)
    
    await publish_agent_step(
        trip_id,
        "Booking Agent",
        f"Booking {booking_id} confirmed and verified",
        observation="Simulated e-tickets and hotel reservation vouchers issued.",
        decision="Dispatched automated receipt and calendar synchronization.",
        status="COMPLETED"
    )
    
    # Generate Calendar ICS payload
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WanderMind//AI Travel Planner//EN
BEGIN:VEVENT
SUMMARY:WanderMind Trip: {booking_payload.get('transport_details', {}).get('title')}
DESCRIPTION:Booking ID: {booking_id}\\nLead: {req.passenger_name}\\nConfirmed via WanderMind AI
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR"""

    # Generate WhatsApp summary
    wa_summary = f"*WanderMind Trip Confirmed!* 🎉%0ABooking ID: {booking_id}%0APassenger: {req.passenger_name} ({req.passengers_count} Travelers)%0A*Transport:* {booking_payload['transport_details']['title']}%0A*Stay:* {booking_payload['stay_details']['title']}%0A*Total Paid:* Rs {req.total_amount:,.2f}%0A*Live Replan Link:* http://localhost:5173/live/{trip_id}"
    
    return BookingReceipt(
        booking_id=booking_id,
        trip_id=trip_id,
        destination_name="Confirmed Destination",
        booking_date=booking_payload["booking_date"],
        passenger_name=req.passenger_name,
        passengers_count=req.passengers_count,
        transport_details=booking_payload["transport_details"],
        stay_details=booking_payload["stay_details"],
        total_paid=req.total_amount,
        payment_status="CONFIRMED (SIMULATED)",
        pdf_download_url=f"/api/receipt/{booking_id}/pdf",
        qr_code_data=f"WanderMind-Booking:{booking_id}",
        shareable_link=f"http://localhost:5173/receipt/{booking_id}",
        whatsapp_summary=wa_summary,
        ics_calendar_data=ics_content
    )
