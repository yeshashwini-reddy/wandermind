import pytest
import asyncio
from models.schemas import AgenticTravelSearchRequest, TransportOption
from agents.trip_graph import run_agentic_travel_search
from agents.gemini_reasoning import extract_preferences_with_gemini
from agents.constraint_validator import ConstraintValidator
from services.provider_registry import ProviderRegistry
from tools.travel_search_service import TravelSearchService

@pytest.mark.asyncio
async def test_scenario_1_fastest_preference():
    """TEST 1: User specifies destination + budget + fastest preference."""
    req = AgenticTravelSearchRequest(
        query="I want to travel from Hyderabad to Goa with my parents. My budget is 25000. I want the fastest option and don't want overnight travel.",
        origin="Hyderabad",
        destination="Goa",
        travelers=3,
        budget=25000.0,
        priority="fastest",
        has_elders=True,
        no_overnight=True,
        trip_id="test_fastest"
    )
    res = await run_agentic_travel_search(req)
    assert res.validation_passed is True
    assert len(res.options) > 0
    # Top option should be flight (fastest)
    top = res.options[0]
    assert top.transport_mode == "flight"
    assert "h" in top.duration
    assert top.booking_url.startswith("http")
    assert not top.is_overnight

@pytest.mark.asyncio
async def test_scenario_2_cheapest_preference():
    """TEST 2: User specifies destination + cheapest preference."""
    req = AgenticTravelSearchRequest(
        origin="Hyderabad",
        destination="Goa",
        travelers=2,
        budget=15000.0,
        priority="cheapest",
        no_overnight=False,
        trip_id="test_cheapest"
    )
    res = await run_agentic_travel_search(req)
    assert res.validation_passed is True
    assert len(res.options) > 0
    # The cheapest option should have lowest price per person
    prices = [o.price for o in res.options]
    assert min(prices) <= 1500

@pytest.mark.asyncio
async def test_scenario_3_no_overnight():
    """TEST 3: User specifies destination + no overnight travel."""
    req = AgenticTravelSearchRequest(
        origin="Hyderabad",
        destination="Goa",
        travelers=3,
        budget=30000.0,
        priority="fastest",
        no_overnight=True,
        trip_id="test_no_overnight"
    )
    res = await run_agentic_travel_search(req)
    assert res.validation_passed is True
    for opt in res.options:
        assert opt.is_overnight is False
        if opt.arrival:
            assert "(+1)" not in opt.arrival

@pytest.mark.asyncio
async def test_scenario_4_destination_recommendation_mode():
    """TEST 4: User asks for destination recommendations instead of specifying a destination."""
    req = AgenticTravelSearchRequest(
        query="Where should I travel from Delhi for a relaxing weekend?",
        origin="New Delhi",
        destination=None,
        travelers=2,
        budget=20000.0,
        priority="balanced",
        trip_id="test_dest_rec"
    )
    res = await run_agentic_travel_search(req)
    assert res.destination is not None
    assert len(res.options) > 0
    assert res.validation_passed is True

@pytest.mark.asyncio
async def test_scenario_5_budget_too_low():
    """TEST 5: No option satisfies the budget (budget too low)."""
    req = AgenticTravelSearchRequest(
        origin="New Delhi",
        destination="Goa",
        travelers=4,
        budget=100.0, # Unrealistically low budget of Rs 100 for 4 people
        priority="cheapest",
        no_overnight=False,
        trip_id="test_budget_low"
    )
    res = await run_agentic_travel_search(req)
    # Should cleanly handle without crashing and provide helpful message
    assert res.validation_passed is False or len(res.options) == 0
    assert "budget" in res.summary_verdict.lower() or "no transportation" in res.summary_verdict.lower()

@pytest.mark.asyncio
async def test_scenario_6_booking_url_safety():
    """TEST 6: Verified booking URLs originating from trusted domains."""
    req = AgenticTravelSearchRequest(
        origin="Hyderabad",
        destination="Goa",
        travelers=2,
        budget=25000.0,
        priority="fastest",
        trip_id="test_url_safety"
    )
    res = await run_agentic_travel_search(req)
    for opt in res.options:
        assert opt.booking_url is not None
        assert opt.booking_url.startswith("https://")
        assert ProviderRegistry.is_valid_provider_url(opt.booking_url) is True

@pytest.mark.asyncio
async def test_scenario_7_natural_language_extraction():
    """TEST 7: Natural language preference extraction."""
    query = "I want to travel from Hyderabad to Goa with my parents. My budget is 25000. I want the fastest option and don't want overnight travel."
    pref = await extract_preferences_with_gemini(query)
    assert pref.origin.lower() == "hyderabad"
    assert pref.destination.lower() == "goa"
    assert pref.travelers >= 3
    assert pref.budget == 25000.0
    assert pref.priority in ["fastest", "time_saving"]
    assert pref.elderly_traveler is True
    assert pref.overnight_travel is False

@pytest.mark.asyncio
async def test_scenario_8_constraint_validator_rejection():
    """TEST 8: Constraint validator rejects invalid overnight / budget options."""
    opts = [
        TransportOption(
            id="opt-1",
            transport_mode="flight",
            provider="IndiGo",
            origin="Hyderabad",
            destination="Goa",
            price=4000.0,
            total_price=12000.0,
            duration="1h 20m",
            booking_url="https://www.goindigo.in",
            reason="Fastest flight",
            is_overnight=False
        ),
        TransportOption(
            id="opt-2",
            transport_mode="bus",
            provider="Overnight Sleeper",
            origin="Hyderabad",
            destination="Goa",
            price=1200.0,
            total_price=3600.0,
            duration="13h",
            booking_url="https://www.redbus.in",
            reason="Cheapest bus",
            is_overnight=True # Overnight!
        )
    ]
    # Test with no_overnight = True
    passed, valid, rejected, notes = ConstraintValidator.validate_transport_options(
        options=opts,
        budget=15000.0,
        travelers=3,
        no_overnight=True
    )
    assert len(valid) == 1
    assert valid[0].transport_mode == "flight"
    assert len(rejected) == 1
    assert rejected[0]["option"].transport_mode == "bus"

def test_provider_registry_air_india_official_url():
    """TEST 9: Air India resolves to the currently valid official booking page."""
    from services.provider_registry import ProviderRegistry
    url = ProviderRegistry.resolve_booking_url("Air India Express IX-118", "flight")
    assert url == "https://www.airindia.com/en-in/book-flights/"
    assert ProviderRegistry.is_valid_provider_url(url) is True

def test_provider_registry_all_modes():
    """TEST 10: Official URLs for IndiGo, SpiceJet, IRCTC, and redBus."""
    from services.provider_registry import ProviderRegistry
    assert ProviderRegistry.resolve_booking_url("IndiGo 6E-243", "flight") == "https://www.goindigo.in/"
    assert ProviderRegistry.resolve_booking_url("SpiceJet SG-102", "flight") == "https://www.spicejet.com/"
    assert ProviderRegistry.resolve_booking_url("Vande Bharat Express (20978)", "train") == "https://www.irctc.co.in/nget/train-search"
    assert ProviderRegistry.resolve_booking_url("IntrCity SmartBus Volvo", "bus") == "https://www.intrcity.com/"
    assert ProviderRegistry.resolve_booking_url("KSRTC Airavat", "bus") == "https://www.ksrtc.in/"
    assert ProviderRegistry.resolve_booking_url("Zingbus Electric AC", "bus") == "https://www.zingbus.com/"

def test_gemini_hallucinated_url_cannot_override():
    """TEST 11: ConstraintValidator overrides any fake/arbitrary Gemini URL with the official URL."""
    from services.provider_registry import ProviderRegistry
    fake_opt = TransportOption(
        id="opt-fake",
        transport_mode="flight",
        provider="Air India",
        origin="Hyderabad",
        destination="Goa",
        price=4500.0,
        total_price=9000.0,
        duration="1h 20m",
        booking_url="http://fake-airindia-scam.com/phishing", # Hallucinated or malicious URL
        reason="Fastest flight",
        is_overnight=False
    )
    passed, valid, rejected, notes = ConstraintValidator.validate_transport_options(
        options=[fake_opt],
        budget=20000.0,
        travelers=2
    )
    assert len(valid) == 1
    # Must be replaced with official Air India URL
    assert valid[0].booking_url == "https://www.airindia.com/en-in/book-flights/"
    assert ProviderRegistry.is_valid_provider_url(valid[0].booking_url) is True

