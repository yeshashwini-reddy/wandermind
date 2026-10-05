import pytest
from services.provider_registry import ProviderRegistry
from agents.constraint_validator import ConstraintValidator
from models.schemas import TransportOption

def test_provider_registry_air_india():
    url = ProviderRegistry.resolve_booking_url("Air India", "flight")
    assert url == "https://www.airindia.com/en-in/book-flights/"
    assert ProviderRegistry.is_valid_provider_url(url) is True

def test_provider_registry_indigo():
    url = ProviderRegistry.resolve_booking_url("IndiGo 6E-542", "flight")
    assert url == "https://www.goindigo.in/"
    assert ProviderRegistry.is_valid_provider_url(url) is True

def test_provider_registry_spicejet():
    url = ProviderRegistry.resolve_booking_url("SpiceJet SG-871", "flight")
    assert url == "https://www.spicejet.com/"
    assert ProviderRegistry.is_valid_provider_url(url) is True

def test_provider_registry_irctc_railways():
    url = ProviderRegistry.resolve_booking_url("Vande Bharat Express", "train")
    assert url == "https://www.irctc.co.in/nget/train-search"
    assert ProviderRegistry.is_valid_provider_url(url) is True

def test_provider_registry_buses():
    redbus_url = ProviderRegistry.resolve_booking_url("redBus Volvo Multi-Axle", "bus")
    assert redbus_url == "https://www.redbus.in/"
    
    zingbus_url = ProviderRegistry.resolve_booking_url("Zingbus Electric AC", "bus")
    assert zingbus_url == "https://www.zingbus.com/"

    intrcity_url = ProviderRegistry.resolve_booking_url("IntrCity SmartBus", "bus")
    assert intrcity_url == "https://www.intrcity.com/"

    ksrtc_url = ProviderRegistry.resolve_booking_url("KSRTC Airavat", "bus")
    assert ksrtc_url == "https://www.ksrtc.in/"

    tsrtc_url = ProviderRegistry.resolve_booking_url("TSRTC Garuda Plus", "bus")
    assert tsrtc_url == "https://www.tsrtconline.in/"

def test_provider_registry_rejects_hallucinated_or_insecure_urls():
    # Insecure or malicious schemes
    assert ProviderRegistry.is_valid_provider_url("http://airindia.com") is False
    assert ProviderRegistry.is_valid_provider_url("javascript:alert(1)") is False
    assert ProviderRegistry.is_valid_provider_url("data:text/html,evil") is False
    assert ProviderRegistry.is_valid_provider_url("http://localhost:8000/phish") is False
    assert ProviderRegistry.is_valid_provider_url("https://random-fake-booking.com") is False

def test_constraint_validator_overrides_gemini_hallucinated_url():
    """Verify that Gemini CANNOT inject arbitrary URLs and the backend overrides with verified registry URL."""
    fake_option = TransportOption(
        mode="flight",
        transport_mode="flight",
        provider="Air India AI-102",
        origin="Delhi",
        destination="Jaipur",
        reason="Recommended direct flight",
        price=5500.0,
        duration="2h 15m",
        departure="08:00 AM",
        arrival="10:15 AM",
        is_overnight=False,
        booking_url="https://gemini-hallucinated-scam-site.com/book" # Injected by LLM
    )
    
    passed, valid_opts, rejected, notes = ConstraintValidator.validate_transport_options(
        options=[fake_option],
        budget=10000.0,
        travelers=1
    )
    assert len(valid_opts) == 1
    # Check that the hallucinated URL is replaced by the official Air India booking URL
    assert valid_opts[0].booking_url == "https://www.airindia.com/en-in/book-flights/"
